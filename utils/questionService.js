/**
 * @file questionService.js
 * @description Service layer for Question operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';
import { awardBadge, checkGhostBadges } from './badgeService.js';
import { ERRORS } from '../lib/errors.js';

/**
 * Create a new question
 */
export const createQuestion = async (title, body, userId, tagIds = []) => {
    if (!title || !body || !userId) {
        throw new Error('Title, Body, and User ID are required');
    }

    // Input validation
    if (title.length > 300) {
        throw new Error(ERRORS.TITLE_TOO_LONG);
    }

    if (body.length > 30000) {
        throw new Error(ERRORS.BODY_TOO_LONG);
    }

    if (tagIds && tagIds.length > 5) {
        throw new Error(ERRORS.TOO_MANY_TAGS);
    }

    let tagsData = {};
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
        tagsData = {
            create: tagIds.map(id => ({
                Tags: { connect: { tag_id: parseInt(id) } }
            }))
        };
    }

    try {
        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Create the question
            const newQuestion = await tx.questions.create({
                data: {
                    title,
                    body,
                    user_id: parseInt(userId),
                    Question_Tags: tagsData
                },
                include: {
                    Question_Tags: true
                }
            });

            // Award +5 reputation for posting a question
            await tx.users.update({
                where: { user_id: parseInt(userId) },
                data: { reputation: { increment: 5 } }
            });

            // Get question count for badge milestones
            const questionCount = await tx.questions.count({
                where: { user_id: parseInt(userId) }
            });

            return { newQuestion, questionCount };
        });

        // Award badges for question milestones (outside transaction to not block)
        try {
            const { questionCount } = result;

            if (questionCount === 1) {
                await awardBadge(parseInt(userId), 'Student');
            }
            if (questionCount === 5) {
                await awardBadge(parseInt(userId), 'Curious');
            }
            if (questionCount === 30) {
                await awardBadge(parseInt(userId), 'Inquisitive');
            }

            // Check Ghost badges after question creation
            await checkGhostBadges(parseInt(userId));
        } catch (badgeError) {
            console.error("Badge System Error:", badgeError);
        }

        return result.newQuestion;
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('title')) {
            throw new Error('A question with this title already exists');
        }
        throw error;
    }
};

/**
 * Get all questions with pagination
 */
export const getAllQuestions = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const totalQuestions = await prisma.questions.count();

    const questions = await prisma.questions.findMany({
        skip,
        take: limit,
        select: {
            question_id: true,
            title: true,
            body: true,
            views_count: true,
            is_closed: true,
            closed_by: true,
            created_at: true,
            updated_at: true,
            Author: {
                select: { user_id: true, username: true, reputation: true, profile_image: true }
            },
            Question_Tags: {
                include: { Tags: { select: { tag_name: true } } }
            },
            Votes: { select: { vote_type: true } },
            _count: {
                select: { Answers: true, Votes: true, Comments: true }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return { questions, totalQuestions, totalPages: Math.ceil(totalQuestions / limit) };
};

/**
 * Get question by ID
 */
export const getQuestionById = async (questionId) => {
    const question = await prisma.questions.findUnique({
        where: { question_id: questionId },
        select: {
            question_id: true,
            title: true,
            body: true,
            views_count: true,
            is_closed: true,
            closed_by: true,
            created_at: true,
            updated_at: true,
            Author: {
                select: { user_id: true, username: true, reputation: true, profile_image: true }
            },
            Question_Tags: {
                include: { Tags: { select: { tag_id: true, tag_name: true } } }
            },
            Comments: {
                include: {
                    Users: {
                        select: { username: true, profile_image: true }
                    }
                }
            },
            Votes: { select: { vote_type: true } },
            _count: {
                select: { Answers: true, Votes: true, Comments: true }
            }
        }
    });

    if (!question) {
        throw new Error('Question not found');
    }

    return question;
};

/**
 * Get question by ID with optional view increment
 */
export const fetchQuestionById = async (questionId, incrementView = false) => {
    if (incrementView) {
        const question = await prisma.questions.update({
            where: { question_id: questionId },
            data: { views_count: { increment: 1 } },
            include: {
                Author: { select: { username: true, reputation: true, profile_image: true } },
                Question_Tags: { include: { Tags: true } },
                Votes: { select: { vote_type: true } },
                Comments: { include: { Users: { select: { username: true, profile_image: true } } } },
                _count: { select: { Answers: true } }
            }
        });

        if (!question) throw new Error('Question not found');
        return question;
    }

    return await getQuestionById(questionId);
};

/**
 * Update a question
 */
export const updateQuestion = async (questionId, title, body, userId, isAdmin = false) => {
    // perform edit history record + update inside a transaction
    const oldQuestion = await prisma.questions.findUnique({ where: { question_id: questionId } });

    if (!oldQuestion) throw new Error('Question not found');
    if (!isAdmin && oldQuestion.user_id !== parseInt(userId)) throw new Error('Unauthorized to update this question');

    try {
        const updated = await prisma.$transaction(async (tx) => {
            await tx.edit_History.create({
                data: {
                    question_id: questionId,
                    user_id: parseInt(userId),
                    old_body: oldQuestion.body,
                    new_body: body,
                    created_at: new Date()
                }
            });

            return await tx.questions.update({
                where: { question_id: questionId },
                data: {
                    title: title ?? oldQuestion.title,
                    body: body ?? oldQuestion.body,
                    updated_at: new Date()
                },
                include: { Question_Tags: true }
            });
        });

        return updated;
    } catch (error) {
        if (error.code === 'P2002') throw new Error('Question title already exists');
        if (error.code === 'P2025') throw new Error('Question not found');
        throw error;
    }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (questionId, userId) => {
    try {
        const question = await prisma.questions.findUnique({
            where: { question_id: questionId }
        });

        if (!question) {
            throw new Error('Question not found');
        }

        if (question.user_id !== parseInt(userId)) {
            throw new Error('Unauthorized to delete this question');
        }

        await prisma.questions.delete({
            where: { question_id: questionId }
        });

        return { success: true };
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Question not found');
        }
        throw error;
    }
};

/**
 * Get question edit history
 */
export const getQuestionHistory = async (questionId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const totalHistory = await prisma.edit_History.count({
        where: { question_id: parseInt(questionId) }
    });

    const history = await prisma.edit_History.findMany({
        where: { question_id: parseInt(questionId) },
        skip,
        take: limit,
        include: {
            Users: {
                select: { username: true, profile_image: true }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return { history, totalHistory, totalPages: Math.ceil(totalHistory / limit) };
};

/**
 * Search questions by keyword
 */
export const searchQuestions = async (keyword, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const questions = await prisma.questions.findMany({
        where: {
            OR: [
                { title: { contains: keyword } },
                { body: { contains: keyword } }
            ]
        },
        skip,
        take: limit,
        include: {
            Author: {
                select: { user_id: true, username: true, reputation: true, profile_image: true }
            },
            Question_Tags: {
                include: { Tags: { select: { tag_name: true } } }
            }
        }
    });

    const total = await prisma.questions.count({
        where: {
            OR: [
                { title: { contains: keyword } },
                { body: { contains: keyword } }
            ]
        }
    });

    return { questions, total, totalPages: Math.ceil(total / limit) };
};

/**
 * Get questions by tag
 */
export const getQuestionsByTag = async (tagId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const questions = await prisma.questions.findMany({
        where: {
            Question_Tags: {
                some: { tag_id: parseInt(tagId) }
            }
        },
        skip,
        take: limit,
        include: {
            Author: {
                select: { user_id: true, username: true, reputation: true, profile_image: true }
            },
            Question_Tags: {
                include: { Tags: { select: { tag_name: true } } }
            }
        }
    });

    const total = await prisma.questions.count({
        where: {
            Question_Tags: {
                some: { tag_id: parseInt(tagId) }
            }
        }
    });

    return { questions, total, totalPages: Math.ceil(total / limit) };
};

/**
 * Close a question
 */
export const closeQuestion = async (questionId, userId) => {
    try {
        const question = await prisma.questions.update({
            where: { question_id: questionId },
            data: {
                is_closed: true,
                closed_by: parseInt(userId)
            }
        });

        return question;
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Question not found');
        }
        throw error;
    }
};

/**
 * Increment question views count
 */
export const incrementViewCount = async (questionId) => {
    try {
        const question = await prisma.questions.update({
            where: { question_id: questionId },
            data: {
                views_count: { increment: 1 }
            }
        });

        return question;
    } catch (error) {
        throw error;
    }
};
