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
            const { title, body, user_id, tag_ids } = req.body;

            if (!title || !body || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Title, Body, and User ID are required"
                });
            }

            let tagsData = {};
            if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
                tagsData = {
                    create: tag_ids.map(id => ({
                        Tags: { connect: { tag_id: parseInt(id) } }
                    }))
                };
            }

            const newQuestion = await prisma.questions.create({
                data: {
                    title,
                    body,
                    user_id: parseInt(user_id),
                    Question_Tags: tagsData
                },
                include: {
                    Question_Tags: true
                }
            });

            res.status(201).json({
                success: true,
                message: "Question posted successfully 🚀",
                data: newQuestion
            });
        } catch (error) {
            console.error(error);

            if (error.code === 'P2002' && error.meta?.target?.includes('title')) {
                return res.status(409).json({
                    success: false,
                    message: "A question with this title already exists. Please choose a different title."
                });
            }

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
            const questions = await prisma.questions.findMany({
                include: {
                    Author: {
                        select: {
                            username: true,
                            reputation: true
                        }
                    },
                    Question_Tags: {
                        include: {
                            Tags: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

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