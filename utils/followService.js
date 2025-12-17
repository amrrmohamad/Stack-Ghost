/**
 * @file followService.js
 * @description Service layer for Follow operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';

/**
 * Toggle follow/unfollow a user
 */
export const toggleFollowUser = async (targetUserId, currentUserId) => {
    if (parseInt(targetUserId) === parseInt(currentUserId)) {
        throw new Error('You cannot follow yourself');
    }

    try {
        const existingFollow = await prisma.follow_Users.findUnique({
            where: {
                user_id_followed_user_id: {
                    user_id: parseInt(currentUserId),
                    followed_user_id: parseInt(targetUserId)
                }
            }
        });

        if (existingFollow) {
            await prisma.follow_Users.delete({
                where: {
                    user_id_followed_user_id: {
                        user_id: parseInt(currentUserId),
                        followed_user_id: parseInt(targetUserId)
                    }
                }
            });

            return { status: 'unfollowed', message: 'Unfollowed successfully' };

        } else {
            await prisma.follow_Users.create({
                data: {
                    user_id: parseInt(currentUserId),
                    followed_user_id: parseInt(targetUserId),
                    created_at: new Date()
                }
            });

            return { status: 'followed', message: 'Followed successfully' };
        }

    } catch (error) {
        if (error.code === 'P2003') {
            throw new Error('User not found');
        }
        throw error;
    }
};

/**
 * Get followers of a user
 */
export const getFollowers = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    if (isNaN(parseInt(userId))) {
        throw new Error('Invalid User ID');
    }

    const totalFollowers = await prisma.follow_Users.count({
        where: { followed_user_id: parseInt(userId) }
    });

    const followers = await prisma.follow_Users.findMany({
        where: { followed_user_id: parseInt(userId) },
        skip,
        take: limit,
        include: {
            Follower: {
                select: { user_id: true, username: true, profile_image: true, reputation: true }
            }
        }
    });

    const formattedFollowers = followers.map(f => f.Follower);

    return { followers: formattedFollowers, totalFollowers, totalPages: Math.ceil(totalFollowers / limit) };
};

/**
 * Get users that a specific user is following
 */
export const getFollowing = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    if (isNaN(parseInt(userId))) {
        throw new Error('Invalid User ID');
    }

    const totalFollowing = await prisma.follow_Users.count({
        where: { user_id: parseInt(userId) }
    });

    const following = await prisma.follow_Users.findMany({
        where: { user_id: parseInt(userId) },
        skip,
        take: limit,
        include: {
            Followed: {
                select: { user_id: true, username: true, profile_image: true, reputation: true }
            }
        }
    });

    const formattedFollowing = following.map(f => f.Followed);

    return { following: formattedFollowing, totalFollowing, totalPages: Math.ceil(totalFollowing / limit) };
};

/**
 * Toggle follow/unfollow a tag
 */
export const toggleFollowTag = async (tagId, userId) => {
    try {
        const tagExists = await prisma.tags.findUnique({ 
            where: { tag_id: parseInt(tagId) } 
        });
        
        if (!tagExists) {
            throw new Error('Tag not found');
        }

        const existingFollow = await prisma.follow_Tags.findUnique({
            where: {
                user_id_tag_id: {
                    user_id: parseInt(userId),
                    tag_id: parseInt(tagId)
                }
            }
        });

        if (existingFollow) {
            await prisma.follow_Tags.delete({
                where: {
                    user_id_tag_id: {
                        user_id: parseInt(userId),
                        tag_id: parseInt(tagId)
                    }
                }
            });

            return { status: 'unfollowed', message: 'Tag unfollowed successfully' };

        } else {
            await prisma.follow_Tags.create({
                data: {
                    user_id: parseInt(userId),
                    tag_id: parseInt(tagId),
                    created_at: new Date()
                }
            });

            return { status: 'followed', message: 'Tag followed successfully' };
        }

    } catch (error) {
        if (error.code === 'P2003') {
            throw new Error('Tag or User not found');
        }
        throw error;
    }
};

/**
 * Get tags followed by a user
 */
export const getUserFollowedTags = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    if (isNaN(parseInt(userId))) {
        throw new Error('Invalid User ID');
    }

    const totalTags = await prisma.follow_Tags.count({
        where: { user_id: parseInt(userId) }
    });

    const followedTags = await prisma.follow_Tags.findMany({
        where: { user_id: parseInt(userId) },
        skip,
        take: limit,
        include: {
            Tags: {
                select: { tag_id: true, tag_name: true, description: true }
            }
        }
    });

    const formattedTags = followedTags.map(ft => ft.Tags);

    return { tags: formattedTags, totalTags, totalPages: Math.ceil(totalTags / limit) };
};

/**
 * Check if user is following another user
 */
export const isFollowing = async (currentUserId, targetUserId) => {
    const follow = await prisma.follow_Users.findUnique({
        where: {
            user_id_followed_user_id: {
                user_id: parseInt(currentUserId),
                followed_user_id: parseInt(targetUserId)
            }
        }
    });

    return !!follow;
};

/**
 * Check if user is following a tag
 */
export const isFollowingTag = async (userId, tagId) => {
    const follow = await prisma.follow_Tags.findUnique({
        where: {
            user_id_tag_id: {
                user_id: parseInt(userId),
                tag_id: parseInt(tagId)
            }
        }
    });

    return !!follow;
};

/**
 * Get follow statistics for a user
 */
export const getFollowStats = async (userId) => {
    const followersCount = await prisma.follow_Users.count({
        where: { followed_user_id: parseInt(userId) }
    });

    const followingCount = await prisma.follow_Users.count({
        where: { user_id: parseInt(userId) }
    });

    const followedTagsCount = await prisma.follow_Tags.count({
        where: { user_id: parseInt(userId) }
    });

    return { followersCount, followingCount, followedTagsCount };
};
