/**
 * @file tagService.js
 * @description Service layer for Tag operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';

export const createTag = async (tag_name, description) => {
    const existing = await prisma.tags.findUnique({
        where: { tag_name }
    });

    if (existing) {
        throw new Error('Tag already exists');
    }

    return prisma.tags.create({
        data: { tag_name, description }
    });
};

export const getAllTags = async (page, limit, q, userId = null) => {
    const skip = (page - 1) * limit;

    const where = q
        ? { tag_name: { contains: q, mode: 'insensitive' } }
        : {};

    const [tags, totalTags] = await Promise.all([
        prisma.tags.findMany({
            where,
            skip,
            take: limit,
            orderBy: { tag_name: 'asc' },
            include: {
                _count: {
                    select: {
                        Question_Tags: true,
                        Follow_Tags: true
                    }
                }
            }
        }),
        prisma.tags.count({ where })
    ]);

    // Get followed tags for current user if userId provided
    let followedTagIds = [];
    if (userId) {
        const followedTags = await prisma.follow_Tags.findMany({
            where: { user_id: userId },
            select: { tag_id: true }
        });
        followedTagIds = followedTags.map(ft => ft.tag_id);
    }

    // Format tags with counts and follow status
    const formattedTags = tags.map(tag => ({
        tag_id: tag.tag_id,
        tag_name: tag.tag_name,
        description: tag.description || '',
        questionCount: tag._count.Question_Tags,
        followers: tag._count.Follow_Tags,
        isFollowed: userId ? followedTagIds.includes(tag.tag_id) : false,
        created_at: tag.created_at
    }));

    return {
        tags: formattedTags,
        totalTags,
        totalPages: Math.ceil(totalTags / limit),
        count: formattedTags.length
    };
};

export const updateTag = async (tagId, tag_name, description) => {
    const tag = await prisma.tags.findUnique({
        where: { tag_id: tagId }
    });

    if (!tag) throw new Error('Tag not found');

    if (tag_name) {
        const exists = await prisma.tags.findFirst({
            where: {
                tag_name,
                tag_id: { not: tagId }
            }
        });
        if (exists) throw new Error('Tag name already exists');
    }

    return prisma.tags.update({
        where: { tag_id: tagId },
        data: { tag_name, description }
    });
};

export const deleteTag = async (tagId) => {
    const related = await prisma.question_Tags.count({
        where: { tag_id: tagId }
    });

    if (related > 0) {
        throw new Error('Tag is associated with questions');
    }

    return prisma.tags.delete({
        where: { tag_id: tagId }
    });
};

