/**
 * @file commentService.js
 * @description Service layer for Comment operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new comment
 */
export const createComment = async (body, userId, questionId = null, answerId = null) => {
    if (!body || !userId) {
        throw new Error('Body and User ID are required');
    }

    if (!questionId && !answerId) {
        throw new Error('Comment must belong to either a Question OR an Answer');
    }

    try {
        const newComment = await prisma.comments.create({
            data: {
                body,
                user_id: parseInt(userId),
                question_id: questionId ? parseInt(questionId) : null,
                answer_id: answerId ? parseInt(answerId) : null
            }
        });

        return newComment;
    } catch (error) {
        throw error;
    }
};

/**
 * Get comments for question or answer
 */
export const getComments = async (questionId = null, answerId = null, page = 1, limit = 10) => {
    if (!questionId && !answerId) {
        throw new Error('Please provide either question_id or answer_id');
    }

    const skip = (page - 1) * limit;
    let whereClause = {};

    if (questionId) {
        whereClause.question_id = parseInt(questionId);
    } else if (answerId) {
        whereClause.answer_id = parseInt(answerId);
    }

    const totalComments = await prisma.comments.count({ where: whereClause });

    const comments = await prisma.comments.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
            Users: {
                select: { username: true, profile_image: true, reputation: true }
            }
        },
        orderBy: { created_at: 'asc' }
    });

    return { comments, totalComments, totalPages: Math.ceil(totalComments / limit) };
};

/**
 * Get comment by ID
 */
export const getCommentById = async (commentId) => {
    const comment = await prisma.comments.findUnique({
        where: { comment_id: commentId },
        include: {
            Users: {
                select: { username: true, profile_image: true, reputation: true }
            }
        }
    });

    if (!comment) {
        throw new Error('Comment not found');
    }

    return comment;
};

/**
 * Update a comment
 */
export const updateComment = async (commentId, body, userId) => {
    try {
        const comment = await prisma.comments.findUnique({
            where: { comment_id: commentId }
        });

        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.user_id !== parseInt(userId)) {
            throw new Error('You are not authorized to update this comment');
        }

        if (!body) {
            throw new Error('Comment body is required');
        }

        const updatedComment = await prisma.comments.update({
            where: { comment_id: commentId },
            data: { body }
        });

        return updatedComment;
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Comment not found');
        }
        throw error;
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId, userId) => {
    try {
        const comment = await prisma.comments.findUnique({
            where: { comment_id: commentId }
        });

        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.user_id !== parseInt(userId)) {
            throw new Error('You are not authorized to delete this comment');
        }

        await prisma.comments.delete({
            where: { comment_id: commentId }
        });

        return { success: true };
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Comment not found');
        }
        throw error;
    }
};

/**
 * Get comments by user
 */
export const getUserComments = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const totalComments = await prisma.comments.count({
        where: { user_id: parseInt(userId) }
    });

    const comments = await prisma.comments.findMany({
        where: { user_id: parseInt(userId) },
        skip,
        take: limit,
        include: {
            Questions: {
                select: { question_id: true, title: true }
            },
            Answers: {
                select: { answer_id: true, body: true }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return { comments, totalComments, totalPages: Math.ceil(totalComments / limit) };
};
