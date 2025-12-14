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
            const { question_id, answer_id } = req.query;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            if (!question_id && !answer_id) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide either question_id or answer_id in query params"
                });
            }

            let whereClause = {};
            if (question_id) {
                whereClause.question_id = parseInt(question_id);
            } else if (answer_id) {
                whereClause.answer_id = parseInt(answer_id);
            }

            const totalComments = await prisma.comments.count({
                where: whereClause
            });

            const comments = await prisma.comments.findMany({
                where: whereClause,
                skip: skip,      
                take: limit,     
                include: {
                    Users: {
                        select: { username: true, profile_image: true, reputation: true }
                    }
                },
                orderBy: {
                    created_at: 'asc' 
                }
            });

            res.status(200).json({
                success: true,
                count: comments.length,
                total: totalComments,
                totalPages: Math.ceil(totalComments / limit),
                currentPage: page,
                data: comments
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Update an existing comment
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async updateComment(req, res) {
        try {
            const { id } = req.params;
            const { body, user_id } = req.body; 
            const commentId = parseInt(id);

            if (isNaN(commentId)) {
                return res.status(400).json({ success: false, message: "Invalid Comment ID" });
            }

            if (!body) {
                return res.status(400).json({ success: false, message: "Comment body is required" });
            }

            const comment = await prisma.comments.findUnique({
                where: { comment_id: commentId }
            });

            if (!comment) {
                return res.status(404).json({ success: false, message: "Comment not found" });
            }

            if (user_id && comment.user_id !== parseInt(user_id)) {
                return res.status(403).json({ success: false, message: "You are not authorized to update this comment" });
            }

            const updatedComment = await prisma.comments.update({
                where: { comment_id: commentId },
                data: {
                    body: body,
                }
            });

            res.status(200).json({
                success: true,
                message: "Comment updated successfully",
                data: updatedComment
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Delete a comment
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async deleteComment(req, res) {
        try {
            const { id } = req.params;
            const { user_id } = req.body;
            const commentId = parseInt(id);

            if (isNaN(commentId)) {
                return res.status(400).json({ success: false, message: "Invalid Comment ID" });
            }

            const comment = await prisma.comments.findUnique({
                where: { comment_id: commentId }
            });

            if (!comment) {
                return res.status(404).json({ success: false, message: "Comment not found" });
            }

            if (user_id && comment.user_id !== parseInt(user_id)) {
                return res.status(403).json({ success: false, message: "You are not authorized to delete this comment" });
            }

            await prisma.comments.delete({
                where: { comment_id: commentId }
            });

            res.status(200).json({
                success: true,
                message: "Comment deleted successfully"
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new CommentController();