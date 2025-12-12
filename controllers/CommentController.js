/**
 * @file CommentController.js
 * @description Controller responsible for handling Comment CRUD operations on Questions and Answers.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-12
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CommentController {

    /**
     * Create a new Comment
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async createComment(req, res) {
        try {
            const { body, user_id, question_id, answer_id } = req.body;

            if (!body || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Body and User ID are required"
                });
            }

            if (!question_id && !answer_id) {
                return res.status(400).json({
                    success: false,
                    message: "Comment must belong to either a Question OR an Answer"
                });
            }

            const newComment = await prisma.comments.create({
                data: {
                    body,
                    user_id: parseInt(user_id),
                    // لو القيمة موجودة حولها لرقم، لو مش موجودة خليها null
                    question_id: question_id ? parseInt(question_id) : null,
                    answer_id: answer_id ? parseInt(answer_id) : null
                }
            });

            res.status(201).json({
                success: true,
                message: "Comment added successfully 💬",
                data: newComment
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get comments by question_id OR answer_id
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async getComments(req, res) {
        try {
            // هنا بناخد البيانات من اللينك (Query Params) مش من البودي
            const { question_id, answer_id } = req.query;

            // لازم نتأكد إن اليوزر باعت واحد منهم على الأقل
            if (!question_id && !answer_id) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide either question_id or answer_id in query params"
                });
            }

            // نجهز الفلتر بناءً على اللي مبعوت
            let whereClause = {};
            
            if (question_id) {
                whereClause.question_id = parseInt(question_id);
            } else if (answer_id) {
                whereClause.answer_id = parseInt(answer_id);
            }

            const comments = await prisma.comments.findMany({
                where: whereClause,
                include: {
                    // هات بيانات اليوزر اللي كتب التعليق (اسمه وصورته)
                    Users: {
                        select: { username: true, profile_image: true, reputation: true }
                    }
                },
                orderBy: {
                    created_at: 'asc' // القديم الأول (زي الشات)
                }
            });

            res.status(200).json({
                success: true,
                count: comments.length,
                data: comments
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new CommentController();