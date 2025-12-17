/**
 * @file AnswerController.js
 * @description Controller responsible for handling Answer CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import * as answerService from '../utils/answerService.js';

class AnswerController {
    /**
     * Create a new answer
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async createAnswer(req, res) {
        try {
            const { body, questionId } = req.body;
            const userId = req.user?.user_id;

            if (!body || !questionId) {
                return res.status(400).json({
                    success: false,
                    message: "Body and Question ID are required"
                });
            }

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const newAnswer = await answerService.createAnswer(body, questionId, userId);

            res.status(201).json({
                success: true,
                message: "Answer added successfully 🚀",
                data: newAnswer
            });
        } catch (error) {
            if (error.message.includes("closed")) {
                return res.status(403).json({ success: false, message: "Question is closed. Cannot add new answers." });
            }
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: "Question not found" });
            }
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const { answers, totalAnswers, totalPages } =
                await answerService.getQuestionAnswers(questionId, page, limit);

            res.status(200).json({
                success: true,
                count: answers.length,
                total: totalAnswers,
                totalPages,
                currentPage: page,
                data: answers
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Accept Answer (Simplified Version - No Token)
     * Expects: user_id (of the requester), question_id, answer_id in body
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async acceptAnswer(req, res) {
        try {
            const { id } = req.params;
            const answerId = parseInt(id);
            const userId = req.user?.user_id;

            if (isNaN(answerId)) {
                return res.status(400).json({ success: false, message: "Invalid Answer ID" });
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            await answerService.acceptAnswer(answerId, userId);

            res.status(200).json({ success: true, message: "Answer accepted, reputation adjusted (switched if needed)." });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes("Unauthorized") || error.message.includes("owner")) {
                return res.status(403).json({ success: false, message: error.message });
            }
            if (error.message.includes("already")) {
                return res.status(400).json({ success: false, message: error.message });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * updateAnswer - is update answer by id
     * @param {req} request 
     * @param {res} response
     * @returns void
     */
    async updateAnswer(req, res) {
        try {
            const { id } = req.params;
            const { body } = req.body;
            const answerId = parseInt(id);
            const userId = req.user?.user_id;

            if (isNaN(answerId)) {
                return res.status(400).json({ success: false, message: "Invalid Answer ID" });
            }

            if (!body) {
                return res.status(400).json({ success: false, message: "Body is required" });
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const result = await answerService.updateAnswer(answerId, body, userId);

            res.status(200).json({
                success: true,
                message: "Answer updated successfully",
                data: result
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes("Unauthorized")) {
                return res.status(403).json({ success: false, message: error.message });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * deleteAnswer - is delete answer by id
     * @req : request
     * @res : response
     * returns
     */
    async deleteAnswer(req, res) {
        try {
            const { id } = req.params;
            const answerId = parseInt(id);
            const userId = req.user?.user_id;

            if (isNaN(answerId)) {
                return res.status(400).json({ success: false, message: "Invalid Answer ID" });
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            await answerService.deleteAnswer(answerId, userId);

            res.status(200).json({
                success: true,
                message: "Answer deleted successfully"
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes("Unauthorized")) {
                return res.status(403).json({ success: false, message: error.message });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

}

export default new AnswerController();