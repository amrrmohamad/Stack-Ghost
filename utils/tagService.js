/**
 * @file tagService.js
 * @description Service layer for Tag operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new tag
 */
export const createTag = async (tagName, description = null) => {
    if (!tagName) {
        throw new Error('Tag name is required');
    }

    try {
        const newTag = await prisma.tags.create({
            data: {
                tag_name: tagName,
                description
            }
        });

        return newTag;
    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('Tag already exists');
        }
        throw error;
    }
};

/**
 * Get all tags with pagination and search
 */
export const getAllTags = async (page = 1, limit = 20, searchQuery = null) => {
    const skip = (page - 1) * limit;
    const whereClause = searchQuery ? { tag_name: { contains: searchQuery } } : {};

    const totalTags = await prisma.tags.count({ where: whereClause });

    const tags = await prisma.tags.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { tag_name: 'asc' },
        include: {
            _count: {
                select: { Question_Tags: true }
            }
        }
    });

    const formattedTags = tags.map(tag => ({
        tag_id: tag.tag_id,
        tag_name: tag.tag_name,
        description: tag.description,
        created_at: tag.created_at,
        questions_count: tag._count.Question_Tags
    }));

    return { tags: formattedTags, totalTags, totalPages: Math.ceil(totalTags / limit) };
};

/**
 * Get tag by ID
 */
export const getTagById = async (tagId) => {
    const tag = await prisma.tags.findUnique({
        where: { tag_id: parseInt(tagId) },
        include: {
            _count: {
                select: { Question_Tags: true }
            }
        }
    });

    if (!tag) {
        throw new Error('Tag not found');
    }

    return {
        ...tag,
        questions_count: tag._count.Question_Tags
    };
};

/**
 * Update tag
 */
export const updateTag = async (tagId, tagName, description) => {
    try {
        const updatedTag = await prisma.tags.update({
            where: { tag_id: parseInt(tagId) },
            data: {
                tag_name: tagName,
                description
            }
        });

        return updatedTag;
    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('Tag name already exists');
        }
        if (error.code === 'P2025') {
            throw new Error('Tag not found');
        }
        throw error;
    }
};

/**
 * Delete tag
 */
export const deleteTag = async (tagId) => {
    try {
        await prisma.tags.delete({
            where: { tag_id: parseInt(tagId) }
        });

        return { success: true };
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Tag not found');
        }
        if (error.code === 'P2003') {
            throw new Error('Cannot delete this tag because it is associated with questions');
        }
        throw error;
    }
};

/**
 * Get popular tags
 */
export const getPopularTags = async (limit = 10) => {
    const tags = await prisma.tags.findMany({
        take: limit,
        include: {
            _count: {
                select: { Question_Tags: true }
            }
        },
        orderBy: {
            Question_Tags: {
                _count: 'desc'
            }
        }
    });

    return tags.map(tag => ({
        tag_id: tag.tag_id,
        tag_name: tag.tag_name,
        description: tag.description,
        questions_count: tag._count.Question_Tags
    }));
};

/**
 * Get questions for a tag
 */
export const getTagQuestions = async (tagId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const totalQuestions = await prisma.question_Tags.count({
        where: { tag_id: parseInt(tagId) }
    });

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
                select: { username: true, reputation: true }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return { questions, totalQuestions, totalPages: Math.ceil(totalQuestions / limit) };
};
