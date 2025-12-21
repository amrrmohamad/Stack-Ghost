/**
 * @file followService.js
 * @description Service layer for Follow operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';
import { createNotification } from './notificationService.js';

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

            // Get the follower's username for the notification
            const follower = await prisma.users.findUnique({
                where: { user_id: parseInt(currentUserId) },
                select: { username: true }
            });

            // Create notification for the followed user
            const notificationContent = JSON.stringify({
                type: 'follow',
                follower_id: parseInt(currentUserId),
                follower_username: follower?.username || 'Someone',
                message: `${follower?.username || 'Someone'} started following you`
            });

            await createNotification(parseInt(targetUserId), notificationContent);

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
export const toggleTagFollow = async (tagId, userId) => {
    try {
        console.log('toggleFollowTag called with:', { tagId, userId });

        const tagIdInt = parseInt(tagId);
        const userIdInt = parseInt(userId);

        if (isNaN(tagIdInt) || isNaN(userIdInt)) {
            throw new Error(`Invalid tag ID or user ID: tagId=${tagId}, userId=${userId}`);
        }

        console.log('Parsed IDs:', { tagIdInt, userIdInt });

        // Verify tag exists
        const tagExists = await prisma.tags.findUnique({
            where: { tag_id: tagIdInt }
        });

        console.log('Tag exists check:', !!tagExists);

        if (!tagExists) {
            throw new Error(`Tag not found: ${tagIdInt}`);
        }

        // Check if follow relationship exists using findFirst (more reliable)
        const existingFollow = await prisma.follow_Tags.findFirst({
            where: {
                user_id: userIdInt,
                tag_id: tagIdInt
            }
        });

        if (existingFollow) {
            // Delete the follow relationship using deleteMany (works with composite keys)
            const deleteResult = await prisma.follow_Tags.deleteMany({
                where: {
                    user_id: userIdInt,
                    tag_id: tagIdInt
                }
            });

            if (deleteResult.count === 0) {
                throw new Error('Failed to unfollow tag - record not found');
            }

            return { status: 'unfollowed', message: 'Tag unfollowed successfully' };

        } else {
            // Create the follow relationship
            console.log('Creating follow relationship:', { userIdInt, tagIdInt });
            const newFollow = await prisma.follow_Tags.create({
                data: {
                    user_id: userIdInt,
                    tag_id: tagIdInt,
                    created_at: new Date()
                }
            });
            console.log('Follow relationship created:', newFollow);

            return { status: 'followed', message: 'Tag followed successfully' };
        }

    } catch (error) {
        console.error('Error in toggleTagFollow:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.code === 'P2003') {
            throw new Error('Tag or User not found');
        }
        if (error.code === 'P2002') {
            throw new Error('Already following this tag');
        }
        if (error.code === 'P2025') {
            throw new Error('Record not found');
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
    const userIdInt = parseInt(userId);

    if (!userIdInt || isNaN(userIdInt)) {
        console.error('Invalid userId in getFollowStats:', userId);
        return { followersCount: 0, followingCount: 0, followedTagsCount: 0 };
    }

    const followersCount = await prisma.follow_Users.count({
        where: { followed_user_id: userIdInt }
    });

    // Get actual following records to verify
    const followingRecords = await prisma.follow_Users.findMany({
        where: { user_id: userIdInt },
        select: { followed_user_id: true }
    });

    // Count unique followed users (in case there are any issues with data)
    const uniqueFollowedUsers = new Set(followingRecords.map(r => r.followed_user_id));
    const followingCount = uniqueFollowedUsers.size;

    // Log to debug - check if there are duplicates or issues
    if (followingRecords.length !== uniqueFollowedUsers.size) {
        console.warn(`⚠️ Duplicate records detected for user ${userIdInt}: total records=${followingRecords.length}, unique users=${uniqueFollowedUsers.size}`);
    }

    console.log(`Follow stats for user ${userIdInt}:`, {
        followersCount,
        followingCount,
        totalRecords: followingRecords.length,
        uniqueFollowedUsers: uniqueFollowedUsers.size,
        sampleFollowedUserIds: Array.from(uniqueFollowedUsers).slice(0, 10)
    });

    const followedTagsCount = await prisma.follow_Tags.count({
        where: { user_id: userIdInt }
    });

    return { followersCount, followingCount, followedTagsCount };
};
