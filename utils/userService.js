/**
 * @file userService.js
 * @description Service layer for User operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';
import { checkGhostBadges } from './badgeService.js';

/**
 * Retrieves all users from the database
 * If admin: shows all data including is_active
 * If regular user: shows only public profile data
 * Excludes the current logged-in user from the results
 */
const getAllUsers = async (page = 1, limit = 100, isAdmin = false, excludeUserId = null, currentUserId = null) => {
    const skip = (page - 1) * limit;
    
    // Only show active users to non-admins, and exclude current user
    const where = isAdmin 
        ? (excludeUserId ? { user_id: { not: excludeUserId } } : {})
        : { 
            is_active: true,
            ...(excludeUserId ? { user_id: { not: excludeUserId } } : {})
        };
    
    const totalUsers = await prisma.users.count({ where });
    const users = await prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reputation: 'desc' },
        select: {
            user_id: true,
            username: true,
            profile_image: true,
            reputation: true,
            created_at: true,
            // Only show is_active to admins
            ...(isAdmin && { is_active: true }),
            _count: {
                select: {
                    AuthoredQuestions: true,
                    Answers: true
                }
            },
            Roles: {
                select: {
                    role_name: true
                }
            }
        }
    });
    
    // Get follow status for each user if currentUserId is provided
    let followedUserIds = [];
    if (currentUserId) {
        const followedUsers = await prisma.follow_Users.findMany({
            where: { user_id: currentUserId },
            select: { followed_user_id: true }
        });
        followedUserIds = followedUsers.map(fu => fu.followed_user_id);
    }
    
    // Add follow status to each user
    const usersWithFollowStatus = users.map(user => ({
        ...user,
        isFollowed: currentUserId ? followedUserIds.includes(user.user_id) : false
    }));
    
    return {
        users: usersWithFollowStatus,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        count: usersWithFollowStatus.length
    };
}

/**
 * Update user state (activate/deactivate) -- admin only
 */
const updateUserState = async (userId, isActive) => {
    if (typeof isActive !== 'boolean') {
        throw new Error('isActive must be boolean');
    }
    try {
        await prisma.users.update({
            where: { user_id: userId },
            data: { is_active: isActive }
        });
        return { success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` };
    } catch (err) {
        if (err.code === 'P2025') {
            throw new Error('User not found');
        }
        throw err;
    }
};

/**
 * Get current logged-in user's profile (for /me)
 */

const getCurrentUser = async (userId) => {
    const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: {
            user_id: true,
            username: true,
            email: true,
            bio: true,
            profile_image: true,
            reputation: true,
            created_at: true,
            is_active: true,
            Roles: {
                select: { role_name: true }
            },
            _count: {
                select: {
                    Answers: true,
                    AuthoredQuestions: true
                }
            }
        }
    });
    if (!user || user.is_active === false) {
        throw new Error('User not found');
    }

    // Check Ghost badges when current user profile is viewed (non-blocking)
    checkGhostBadges(userId).catch(err => {
        console.error(`Error checking badges for user ${userId}:`, err);
    });

    return user;
};

/**
 * Update current user's profile (owner)
 */
const updateProfile = async (userId, updates) => {
    const { username, bio, profile_image } = updates;
    const data = {};
    if (username !== undefined) data.username = username;
    if (bio !== undefined) data.bio = bio;
    if (profile_image !== undefined) data.profile_image = profile_image;
    try {
        const updated = await prisma.users.update({
            where: { user_id: userId },
            data
        });
        return {
            user_id: updated.user_id,
            username: updated.username,
            bio: updated.bio,
            profile_image: updated.profile_image
        };
    } catch (err) {
        if (err.code === 'P2002') {
            throw new Error('Username already taken');
        }
        if (err.code === 'P2025') {
            throw new Error('User not found');
        }
        throw err;
    }
};

/**
 * Get user by ID (public profile view)
 */
const getUserById = async (userId) => {
    const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: {
            user_id: true,
            username: true,
            bio: true,
            profile_image: true,
            reputation: true,
            created_at: true,
            is_active: true,
            Roles: {
                select: { role_name: true }
            },
            _count: {
                select: {
                    Answers: true,
                    AuthoredQuestions: true
                }
            }
        }
    });
    
    if (!user) {
        throw new Error('User not found');
    }
    
    return user;
};

export {
    getAllUsers,
    updateUserState,
    getCurrentUser,
    updateProfile,
    getUserById
};
