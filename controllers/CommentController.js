/**
 * @file CommentController.js
 * @description Controller responsible for handling Comment CRUD operations on Questions and Answers.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import * as commentService from '../utils/commentService.js';
import { ERRORS } from '../lib/errors.js';

class CommentController {

    /**
     * Create a new Comment
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async createComment(req, res) {
        try {
            const { body, question_id, answer_id } = req.body;
            const userId = req.user?.user_id; // Get from JWT token, not body

            if (!body) {
                return res.status(400).json({
                    success: false,
                    message: "Comment body is required"
                });
            }
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: ERRORS.UNAUTHORIZED
                });
            }

            if (!question_id && !answer_id) {
                return res.status(400).json({
                    success: false,
                    message: "Comment must belong to either a Question OR an Answer"
                });
            }

            const newComment = await commentService.createComment(body, userId, question_id, answer_id);

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

            if (!question_id && !answer_id) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide either question_id or answer_id in query params"
                });
            }

            const { comments, totalComments, totalPages } = await commentService.getComments(question_id, answer_id, page, limit);

            res.status(200).json({
                success: true,
                count: comments.length,
                total: totalComments,
                totalPages: totalPages,
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
            const { body } = req.body;
            const userId = req.user?.user_id; // Get from JWT token, not body
            const commentId = parseInt(id);

            if (isNaN(commentId)) {
                return res.status(400).json({ success: false, message: ERRORS.INVALID_ID });
            }

            if (!body) {
                return res.status(400).json({ success: false, message: "Comment body is required" });
            }
            
            if (!userId) {
                return res.status(401).json({ success: false, message: ERRORS.UNAUTHORIZED });
            }

            const updatedComment = await commentService.updateComment(commentId, body, userId);

            res.status(200).json({
                success: true,
                message: "Comment updated successfully",
                data: updatedComment
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes("not authorized")) {
                return res.status(403).json({ success: false, message: error.message });
            }
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
            const userId = req.user?.user_id; // Get from JWT token, not body
            const commentId = parseInt(id);

            if (isNaN(commentId)) {
                return res.status(400).json({ success: false, message: ERRORS.INVALID_ID });
            }
            
            if (!userId) {
                return res.status(401).json({ success: false, message: ERRORS.UNAUTHORIZED });
            }

            await commentService.deleteComment(commentId, userId);

            res.status(200).json({
                success: true,
                message: "Comment deleted successfully"
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes("not authorized")) {
                return res.status(403).json({ success: false, message: error.message });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new CommentController();