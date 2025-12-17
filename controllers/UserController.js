/**
 * @file UserController.js
 * @description Controller responsible for handling User CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../utils/userService.js';


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

            const { users, totalUsers, totalPages } = await getAllUsers(page, limit);

            res.status(200).json({
                success: true,
                count: users.length,
                total: totalUsers,
                totalPages,
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

            const user = await createUser(username, email, password);

            res.status(201).json({
                success: true,
                message: "User registered successfully 🎉",
                data: user
            });

        } catch (error) {
            console.error(error);

            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: "Username or Email already exists!"
                });
            }

            res.status(400).json({ success: false, message: error.message });
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

            const user = await getUserById(userId);

            res.status(200).json({
                success: true,
                data: user 
            });

        } catch (error) {
            console.error(error);
            if (error.message === 'User not found') {
                return res.status(404).json({ success: false, message: "User not found" });
            }
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

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const user = await updateUser(userId, req.body);

            res.status(200).json({
                success: true,
                message: "User profile updated successfully",
                data: user
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes('already exists')) {
                return res.status(409).json({ success: false, message: "Username or Email already exists" });
            }
            if (error.message === 'User not found') {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            res.status(400).json({ success: false, message: error.message });
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

            await deleteUser(userId);

            res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });

        } catch (error) {
            console.error(error);
            if (error.message === 'User not found') {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}
export default new UserController();