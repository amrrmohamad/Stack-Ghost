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
        const newAnswer = await prisma.answers.create({
            data: {
                body,
                question_id: parseInt(questionId),
                user_id: parseInt(userId)
            }
        });

        // Award badge if first answer
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

    return { answers, totalAnswers, totalPages: Math.ceil(totalAnswers / limit) };
};

/**
 * Get answer by ID
 */
export const getAnswerById = async (answerId) => {
    const answer = await prisma.answers.findUnique({
        where: { answer_id: answerId },
        include: {
            Users: {
                select: { user_id: true, username: true, reputation: true, profile_image: true }
            },
            Votes: true,
            Comments: {
                include: {
                    Users: {
                        select: { username: true, profile_image: true }
                    }
                }
            }
        }
    });

    if (!answer) {
        throw new Error('Answer not found');
    }

    return answer;
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

        const updatedAnswer = await prisma.answers.update({
            where: { answer_id: answerId },
            data: {
                body,
                updated_at: new Date()
            }
        });

        return updatedAnswer;
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
 * Mark answer as accepted
 */
export const markAnswerAccepted = async (answerId, questionId, userId) => {
    try {
        const question = await prisma.questions.findUnique({
            where: { question_id: parseInt(questionId) }
        });

        if (!question) {
            throw new Error('Question not found');
        }

        if (question.user_id !== parseInt(userId)) {
            throw new Error('Only question author can accept answers');
        }

        const updatedAnswer = await prisma.answers.update({
            where: { answer_id: answerId },
            data: { is_accepted: true }
        });

        return updatedAnswer;
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Answer not found');
        }
        throw error;
    }
};

/**
 * Unmark answer as accepted
 */
export const unmarkAnswerAccepted = async (answerId, questionId, userId) => {
    try {
        const question = await prisma.questions.findUnique({
            where: { question_id: parseInt(questionId) }
        });

        if (!question) {
            throw new Error('Question not found');
        }

        if (question.user_id !== parseInt(userId)) {
            throw new Error('Only question author can unmark accepted answers');
        }

        const updatedAnswer = await prisma.answers.update({
            where: { answer_id: answerId },
            data: { is_accepted: false }
        });

        return updatedAnswer;
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Answer not found');
        }
        throw error;
    }
};

/**
 * Get user's answers
 */
export const getUserAnswers = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const totalAnswers = await prisma.answers.count({
        where: { user_id: parseInt(userId) }
    });

    const answers = await prisma.answers.findMany({
        where: { user_id: parseInt(userId) },
        skip,
        take: limit,
        include: {
            Questions: {
                select: { question_id: true, title: true }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return { answers, totalAnswers, totalPages: Math.ceil(totalAnswers / limit) };
};
