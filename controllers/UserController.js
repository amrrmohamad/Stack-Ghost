/**
 * @file UserController.js
 * @description Controller responsible for handling User CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


class UserController {
    /**
     * Retrieves all users from the database TO DASHBOARD ADMIN
     * (used in admin dashboard)
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */

    // (======JUST ADMIN USE IT======)
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const totalUsers = await prisma.users.count();

            const users = await prisma.users.findMany({
                skip: skip,
                take: limit,
                orderBy: {
                    reputation: 'desc'
                },
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
                    }, // added the role of user
                    Roles: {
                        select: {
                            role_name: true
                        }
                    }
                }
            });

            res.status(200).json({
                success: true,
                count: users.length,
                total: totalUsers,
                totalPages: Math.ceil(totalUsers / limit),
                currentPage: page,
                data: users
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * update state of user in DASHBOARD
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    //(======JUST ADMIN USE IT======)
    async updateUserState(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'isActive must be boolean'
                });
            }
            console.log(req.user);

            await prisma.users.update({
                where: { user_id: userId },
                data: { is_active: isActive }
            });

            res.json({
                success: true,
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
      * Authenticated user: get his own data
      * RETURN all data for logged in user (current user) (used in profile page)
      */
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.user_id;

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
                    Roles: {
                        select: { role_name: true }
                    }
                }
            });

            res.json({ success: true, data: user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Public user profile
     * RETURN information about another users (used in following page)
     */
    async getUserProfile(req, res) {
        try {
            const userId = parseInt(req.params.id);

            const user = await prisma.users.findUnique({
                where: { user_id: userId },
                select: {
                    user_id: true,
                    username: true,
                    bio: true,
                    profile_image: true,
                    reputation: true,
                    Roles: { select: { role_name: true } },
                    created_at: true,
                    is_active: true,
                    _count: {
                        select: {
                            Answers: true,
                            AuthoredQuestions: true
                        }
                    }
                }
            });

            if (!user || !user.is_active) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.json({ success: true, data: user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Owner: update profile info
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.user_id;
            const { username, bio, profile_image } = req.body;

            // Only include fields that are provided
            const data = {};
            if (username !== undefined) data.username = username;
            if (bio !== undefined) data.bio = bio;
            if (profile_image !== undefined) data.profile_image = profile_image;

            // Debug log you can remove it
            console.log('UpdateProfile:', { userId, data });
            
            const updated = await prisma.users.update({
                where: { user_id: userId },
                data
            });

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user_id: updated.user_id,
                    username: updated.username,
                    bio: updated.bio,
                    profile_image: updated.profile_image
                }
            });
        } catch (err) {
            if (err.code === 'P2002') {
                return res.status(409).json({ success: false, message: 'Username already taken' });
            }
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}
export default new UserController();