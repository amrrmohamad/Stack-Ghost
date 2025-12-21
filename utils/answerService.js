/**
 * @file answerService.js
 * @description Service layer for Answer operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';
import { awardBadge, checkGhostBadges } from './badgeService.js';
import { ERRORS } from '../lib/errors.js';
import { createNotification } from './notificationService.js';

/**
 * Create a new answer
 */
export const createAnswer = async (body, questionId, userId) => {
    if (!body || !questionId || !userId) {
        throw new Error('Body, Question ID, and User ID are required');
    }

    try {
        const question = await prisma.questions.findUnique({
            where: { question_id: parseInt(questionId) },
            select: { is_closed: true, user_id: true }
        });

        if (!question) {
            throw new Error('Question not found');
        }

        if (question.is_closed) {
            throw new Error('Question is closed');
        }

        const newAnswer = await prisma.answers.create({
            data: {
                body,
                question_id: parseInt(questionId),
                user_id: parseInt(userId)
            }
        });

        // Send notification to question owner
        try {
            if (question.user_id !== parseInt(userId)) {
                // Get answerer's username
                const answerer = await prisma.users.findUnique({
                    where: { user_id: parseInt(userId) },
                    select: { username: true }
                });

                const notificationContent = JSON.stringify({
                    type: 'new_answer',
                    message: `@${answerer?.username || 'Someone'} answered your question`,
                    question_id: parseInt(questionId),
                    answerer_username: answerer?.username || 'Unknown'
                });
                await createNotification(question.user_id, notificationContent);
            }
        } catch (notificationError) {
            console.error('Error creating answer notification:', notificationError);
            // Don't fail the answer creation if notification fails
        }

        try {
            const answerCount = await prisma.answers.count({
                where: { user_id: parseInt(userId) }
            });

            if (answerCount === 1) {
                await awardBadge(parseInt(userId), 'Teacher');
            }

            // Check Ghost badges after answer creation
            await checkGhostBadges(parseInt(userId));
        } catch (badgeError) {
            console.error("Badge System Error:", badgeError);
        }

        return newAnswer;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all answers for a question
 */
export const getQuestionAnswers = async (questionId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const totalAnswers = await prisma.answers.count({
        where: { question_id: parseInt(questionId) }
    });

    const answers = await prisma.answers.findMany({
        where: { question_id: parseInt(questionId) },
        skip,
        take: limit,
        include: {
            Users: {
                select: { username: true, reputation: true, profile_image: true }
            },
            Votes: true,
            Comments: {
                include: {
                    Users: {
                        select: { username: true, profile_image: true }
                    }
                },
                orderBy: { created_at: 'asc' }
            }
        },
        orderBy: {
            is_accepted: 'desc'
        }
    });

    const answersWithCounts = answers.map(answer => {
        const voteCount = answer.Votes.reduce((acc, vote) => {
            return acc + (vote.vote_type ?? 0); // FIXED: was vote.value, should be vote.vote_type
        }, 0);

        const { Votes, ...rest } = answer;
        return {
            ...rest,
            vote_count: voteCount
        };
    });

    return {
        answers: answersWithCounts,
        totalAnswers,
        totalPages: Math.ceil(totalAnswers / limit)
    };
};

/**
 * Update an answer
 */
export const updateAnswer = async (answerId, body, userId) => {
    try {
        const answer = await prisma.answers.findUnique({
            where: { answer_id: answerId }
        });

        if (!answer) {
            throw new Error('Answer not found');
        }

        if (answer.user_id !== parseInt(userId)) {
            throw new Error('Unauthorized to update this answer');
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.edit_History.create({
                data: {
                    answer_id: answerId,
                    user_id: parseInt(userId),
                    old_body: answer.body,
                    new_body: body,
                    created_at: new Date()
                }
            });

            const updated = await tx.answers.update({
                where: { answer_id: answerId },
                data: {
                    body,
                    updated_at: new Date()
                }
            });

            return updated;
        });

        return result;
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Answer not found');
        }
        throw error;
    }
};

/**
 * Delete an answer
 */
export const deleteAnswer = async (answerId, userId) => {
    try {
        const answer = await prisma.answers.findUnique({
            where: { answer_id: answerId }
        });

        if (!answer) {
            throw new Error('Answer not found');
        }

        if (answer.user_id !== parseInt(userId)) {
            throw new Error('Unauthorized to delete this answer');
        }

        await prisma.answers.delete({
            where: { answer_id: answerId }
        });

        return { success: true };
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Answer not found');
        }
        throw error;
    }
};

/**
 * Accept / switch accepted answer and update reputations
 * FIXED: Race condition resolved by moving all logic inside transaction
 */
export const acceptAnswer = async (answerId, userId) => {
    return await prisma.$transaction(async (tx) => {
        // Get answer and question info
        const answerToAccept = await tx.answers.findUnique({
            where: { answer_id: answerId },
            include: { Questions: true }
        });

        if (!answerToAccept) {
            throw new Error('Answer not found');
        }

        const questionId = answerToAccept.question_id;
        const questionOwnerId = answerToAccept.Questions.user_id;

        if (questionOwnerId !== parseInt(userId)) {
            throw new Error(ERRORS.ONLY_OWNER_CAN_ACCEPT);
        }

        // FIXED: Prevent accepting own answer
        if (answerToAccept.user_id === questionOwnerId) {
            throw new Error(ERRORS.CANNOT_ACCEPT_OWN_ANSWER);
        }

        if (answerToAccept.is_accepted) {
            throw new Error(ERRORS.ALREADY_ACCEPTED);
        }

        // Find and unaccept old answer (inside transaction to prevent race condition)
        const oldAcceptedAnswer = await tx.answers.findFirst({
            where: {
                question_id: questionId,
                is_accepted: true
            }
        });

        let oldAnswerAuthorId = null;
        if (oldAcceptedAnswer) {
            oldAnswerAuthorId = oldAcceptedAnswer.user_id;
            // Unaccept old answer
            await tx.answers.update({
                where: { answer_id: oldAcceptedAnswer.answer_id },
                data: { is_accepted: false }
            });

            // Deduct reputation from old answerer
            await tx.users.update({
                where: { user_id: oldAcceptedAnswer.user_id },
                data: { reputation: { decrement: 15 } }
            });
        }

        // Accept new answer
        await tx.answers.update({
            where: { answer_id: answerId },
            data: { is_accepted: true }
        });

        // Give reputation to answer author (+15)
        await tx.users.update({
            where: { user_id: answerToAccept.user_id },
            data: { reputation: { increment: 15 } }
        });

        // Give reputation to question owner for accepting (+2)
        await tx.users.update({
            where: { user_id: questionOwnerId },
            data: { reputation: { increment: 2 } }
        });

        return {
            success: true,
            answerAuthorId: answerToAccept.user_id,
            questionOwnerId: questionOwnerId,
            oldAnswerAuthorId: oldAnswerAuthorId
        };
    }).then(async (result) => {
        // Check Ghost badges after accepting answer (outside transaction)
        try {
            // Check for answer author (got +15 reputation and has accepted answer)
            await checkGhostBadges(result.answerAuthorId);
            // Check for question owner (got +2 reputation and accepted a question)
            await checkGhostBadges(result.questionOwnerId);
            // Also check for old answer author if answer was unaccepted
            if (result.oldAnswerAuthorId) {
                await checkGhostBadges(result.oldAnswerAuthorId);
            }
        } catch (badgeError) {
            console.error("Badge System Error after accepting answer:", badgeError);
        }
        return result;
    });
};

// Note: helper functions getAnswerById, markAnswerAccepted, unmarkAnswerAccepted, and getUserAnswers
// were removed from the public API as they are currently unused by any route or controller.
