/**
 * @file UserController.js
 * @description Controller responsible for handling User CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();


class UserController {
    /**
     * Retrieves all users from the database
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
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
                    created_at: true,
                    _count: {
                        select: { 
                            AuthoredQuestions: true, 
                            Answers: true    
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
     * Creates a new user in the database.
     * @param {import('express').Request} req - The Express request object containing user data in body.
     * @param {import('express').Response} res - The Express response object.
     */
    async createUser(req, res) {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: username, email, and password are required."
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters long."
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await prisma.users.create({
                data: {
                    username,
                    email,
                    password_hash: hashedPassword, 
                }
            });

            const { password_hash, ...userWithoutPass } = newUser;

            res.status(201).json({
                success: true,
                message: "User registered successfully 🎉",
                data: userWithoutPass
            });

        } catch (error) {
            console.error(error);

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: "Username or Email already exists!"
                });
            }

            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
    /**
     * Get single user by ID
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const userId = parseInt(id);

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

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
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const formattedUser = {
                ...user,
                badges: user.User_Badges.map(ub => ({
                    ...ub.Badges,
                    granted_at: ub.granted_at
                })),
                User_Badges: undefined 
            };

            res.status(200).json({
                success: true,
                data: formattedUser 
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Update user details
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const userId = parseInt(id);
            const { username, email, password, bio, profile_image } = req.body;

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            let updateData = {};

            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (bio) updateData.bio = bio;
            if (profile_image) updateData.profile_image = profile_image;

            if (password) {
                if (password.length < 6) {
                    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
                }
                const salt = await bcrypt.genSalt(10);
                updateData.password_hash = await bcrypt.hash(password, salt);
            }

            const updatedUser = await prisma.users.update({
                where: { user_id: userId },
                data: updateData
            });

            const { password_hash, ...userWithoutPass } = updatedUser;

            res.status(200).json({
                success: true,
                message: "User profile updated successfully",
                data: userWithoutPass
            });

        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: "Username or Email already exists" });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Delete user account
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const userId = parseInt(id);

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            await prisma.users.delete({
                where: { user_id: userId }
            });

            res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });

        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}
export default new UserController();