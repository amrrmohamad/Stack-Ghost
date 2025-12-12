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
}
export default new UserController();