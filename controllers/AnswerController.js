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
            const { body, question_id, user_id } = req.body;

            if (!body || !question_id || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Body, Question ID, and User ID are required"
                });
            }

            const newAnswer = await answerService.createAnswer(body, question_id, user_id);

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

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const { answers, totalAnswers, totalPages } = await answerService.getQuestionAnswers(questionId, page, limit);

            const answersWithCounts = answers.map(answer => {
                const voteCount = answer.Votes.reduce((acc, vote) => {
                    return acc + (vote.value || vote.vote_type || 0);
                }, 0);

                return {
                    ...answer,
                    vote_count: voteCount,
                    Votes: undefined
                };
            });

            res.status(200).json({
                success: true,
                count: answersWithCounts.length,
                total: totalAnswers,
                totalPages: totalPages,
                currentPage: page,
                data: answersWithCounts
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
            const { user_id, answer_id } = req.body;

            if (!user_id || !answer_id) {
                return res.status(400).json({ success: false, message: "Missing user_id or answer_id" });
            }

            await answerService.acceptAnswer(answer_id, user_id);

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
            const { body, user_id } = req.body;
            const answerId = parseInt(id);

            if (isNaN(answerId)) {
                return res.status(400).json({ success: false, message: "Invalid Answer ID" });
            }

            if (!body || !user_id) {
                return res.status(400).json({ success: false, message: "Body and user_id are required" });
            }

            const result = await answerService.updateAnswer(answerId, body, user_id);

            res.status(200).json({
                success: true,
                message: "Answer updated and history saved",
                data: result
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
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

            if (isNaN(answerId)) {
                return res.status(400).json({ success: false, message: "Invalid Answer ID" });
            }

            await answerService.deleteAnswer(answerId);

            res.status(200).json({
                success: true,
                message: "Answer deleted successfully"
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: "Answer not found" });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

}

export default new AnswerController();