/**
 * @file userService.js
 * @description Service layer for User operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Get all users with pagination
 */
export const getAllUsers = async (page = 1, limit = 20) => {
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
            created_at: true,
            _count: {
                select: { 
                    AuthoredQuestions: true, 
                    Answers: true    
                }
            }
        }
    });

    return { users, totalUsers, totalPages: Math.ceil(totalUsers / limit) };
};

/**
 * Get user by ID with all details
 */
export const getUserById = async (userId) => {
    const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: {
            user_id: true,
            username: true,
            email: true,
            profile_image: true,
            reputation: true,
            bio: true,
            created_at: true,
            
            User_Badges: {
                select: {
                    granted_at: true,
                    Badges: {        
                        select: {
                            badge_name: true,
                            description: true,
                            badge_type: true, 
                            icon: true
                        }
                    }
                }
            },

            _count: {
                select: {
                    AuthoredQuestions: true,
                    Answers: true
                }
            }
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return {
        ...user,
        badges: user.User_Badges.map(ub => ({
            ...ub.Badges,
            granted_at: ub.granted_at
        })),
        User_Badges: undefined 
    };
};

/**
 * Create a new user
 */
export const createUser = async (username, email, password) => {
    if (!username || !email || !password) {
        throw new Error('Missing required fields');
    }

    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const newUser = await prisma.users.create({
            data: {
                username,
                email,
                password_hash: hashedPassword
            }
        });

        const { password_hash, ...userWithoutPass } = newUser;
        return userWithoutPass;
    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('Username or Email already exists');
        }
        throw error;
    }
};

/**
 * Update user profile
 */
export const updateUser = async (userId, updates) => {
    const { username, email, password, bio, profile_image } = updates;
    
    let updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio) updateData.bio = bio;
    if (profile_image) updateData.profile_image = profile_image;

    if (password) {
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(password, salt);
    }

    try {
        const updatedUser = await prisma.users.update({
            where: { user_id: userId },
            data: updateData
        });

        const { password_hash, ...userWithoutPass } = updatedUser;
        return userWithoutPass;
    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('Username or Email already exists');
        }
        if (error.code === 'P2025') {
            throw new Error('User not found');
        }
        throw error;
    }
};

/**
 * Delete user account
 */
export const deleteUser = async (userId) => {
    try {
        await prisma.users.delete({
            where: { user_id: userId }
        });
        return { success: true };
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('User not found');
        }
        throw error;
    }
};
