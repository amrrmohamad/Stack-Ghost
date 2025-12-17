import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
/**
 * @file userService.js
 * @description Service layer for User operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

/**
 * Retrieves all users from the database (admin dashboard)
 */
const getAllUsers = async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const totalUsers = await prisma.users.count();
    const users = await prisma.users.findMany({
        skip,
        take: limit,
        orderBy: { reputation: 'desc' },
        select: {
            user_id: true,
            username: true,
            profile_image: true,
            reputation: true,
            is_active: true,
            created_at: true,
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
    return {
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        count: users.length
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
export {
    getAllUsers,
    updateUserState,
    getCurrentUser,
    updateProfile
};
