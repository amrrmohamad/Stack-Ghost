/**
 * @file AnswerController.js
 * @description Controller responsible for handling Answer CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class AnswerController {
    /**
     * Create a new answer
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async createAnswer(req, res) {
        try {
            const { body, question_id, user_id } = req.body;
            
            if (!body || !question_id || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Body, Question ID, and User ID are required"
                });
            }

            const newAnswer = await prisma.answers.create({
                data: {
                    body,
                    question_id: parseInt(question_id),
                    user_id: parseInt(user_id)
                }
            });

            res.status(201).json({
                success: true,
                message: "Answer added successfully 🚀",
                data: newAnswer
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * get all answers and users who answer it
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async getQuestionAnswers(req, res) {
        try {
            const { questionId } = req.params;

            const answers = await prisma.answers.findMany({
                where: {
                    question_id: parseInt(questionId)
                },
                include: {
                    Users: {
                        select: { username: true, reputation: true }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            res.status(200).json({
                success: true,
                count: answers.length,
                data: answers
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new AnswerController();