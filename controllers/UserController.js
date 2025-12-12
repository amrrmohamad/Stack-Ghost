/**
 * @file UserController.js
 * @description Controller responsible for handling User CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import { PrismaClient } from '@prisma/client'; // ✅ الصح
const prisma = new PrismaClient();


class UserController {
    /**
     * Retrieves all users from the database
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getAllUsers(req, res) {
        try {
            const users = await prisma.users.findMany();
            res.json({
                massage: "success",
                data: users
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "something goes wrong while fetching the data from data base" })
        }
    }

    /**
     * Creates a new user in the database.
     * @param {import('express').Request} req - The Express request object containing user data in body.
     * @param {import('express').Response} res - The Express response object.
     */
    async createUser(req, res) {
        try {
            const { username, email } = req.body;

            // Basic validation layer (should be moved to a validator middleware later)
            if (!username || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide both username and email.'
                });
            }

            const newUser = await prisma.users.create({
                data: {
                    username,
                    email,
                    created_at: new Date()
                }
            });

            // 201 Created is the standard status for successful resource creation
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: newUser
            });
        } catch (error) {
            console.error('[UserController] createUser Error:', error);

            // Check for unique constraint violation (P2002 is Prisma code for unique constraint)
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists.'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            });
        }
    }
}
export default new UserController();