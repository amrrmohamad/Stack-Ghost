/**
 * @file QuestionController.js
 * @description Controller responsible for handling Question CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


class QuestionController {
    /**
     * Create a new question
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async createQuestion(req, res) {
        try {
            const { title, body, user_id } = req.body;
            if (!title || !body || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Title, Body, and User ID are required"
                });
            }
            const newQuestion = await prisma.questions.create({
                data: {
                    title,
                    body,
                    user_id: parseInt(user_id)
                }
            });
            res.status(201).json({
                success: true,
                message: "Question posted successfully 🚀",
                data: newQuestion
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * get all questions
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async getAllQuestions(req, res) {
        try {
            const questions = await prisma.questions.findMany(
                {
                    include: {
                        Users_Questions_user_idToUsers: {
                            select: {
                                username: true,
                                reputation: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                }
            )


            res.status(200).json({
                success: true,
                count: questions.length,
                data: questions
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}
export default new QuestionController();