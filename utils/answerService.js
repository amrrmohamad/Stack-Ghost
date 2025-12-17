/**
 * @file answerService.js
 * @description Service layer for Answer operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import { PrismaClient } from '@prisma/client';
import { awardBadge } from './badgeService.js';

const prisma = new PrismaClient();

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
            select: { is_closed: true }
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

        try {
            const answerCount = await prisma.answers.count({
                where: { user_id: parseInt(userId) }
            });

            if (answerCount === 1) {
                await awardBadge(parseInt(userId), 'Teacher');
            }
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
            return acc + (vote.value ?? 0);
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
 */
export const acceptAnswer = async (answerId, userId) => {
    const answerToAccept = await prisma.answers.findUnique({
        where: { answer_id: answerId },
        include: { Questions: true }
    });

    if (!answerToAccept) {
        throw new Error('Answer not found');
    }

    const questionId = answerToAccept.question_id;
    const questionOwnerId = answerToAccept.Questions.user_id;

    if (questionOwnerId !== parseInt(userId)) {
        throw new Error('Only the question owner can accept an answer.');
    }

    if (answerToAccept.is_accepted) {
        throw new Error('This answer is already accepted.');
    }

    const oldAcceptedAnswer = await prisma.answers.findFirst({
        where: {
            question_id: questionId,
            is_accepted: true
        }
    });

    const transactionOps = [];

    if (oldAcceptedAnswer) {
        transactionOps.push(
            prisma.answers.update({
                where: { answer_id: oldAcceptedAnswer.answer_id },
                data: { is_accepted: false }
            }),
            prisma.users.update({
                where: { user_id: oldAcceptedAnswer.user_id },
                data: { reputation: { decrement: 15 } }
            })
        );
    }

    transactionOps.push(
        prisma.answers.update({
            where: { answer_id: answerId },
            data: { is_accepted: true }
        }),
        prisma.users.update({
            where: { user_id: answerToAccept.user_id },
            data: { reputation: { increment: 15 } }
        })
    );

    await prisma.$transaction(transactionOps);

    return { success: true };
};

// Note: helper functions getAnswerById, markAnswerAccepted, unmarkAnswerAccepted, and getUserAnswers
// were removed from the public API as they are currently unused by any route or controller.
