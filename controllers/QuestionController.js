/**
 * @file QuestionController.js
 * @description Controller responsible for handling Question CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */
import * as questionService from "../utils/questionService.js";

class QuestionController {
    /**
     * Create a new question
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async createQuestion(req, res) {
        try {
            const { title, body, tag_ids } = req.body;
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User not authenticated"
                });
            }

            if (!title || !body) {
                return res.status(400).json({
                    success: false,
                    message: "Title and Body are required"
                });
            }

            const newQuestion = await questionService.createQuestion(title, body, userId, tag_ids);

            res.status(201).json({
                success: true,
                message: "Question posted successfully 🚀",
                data: newQuestion
            });
        } catch (error) {
            console.error(error);

            if (error.message.includes("already exists")) {
                return res.status(409).json({
                    success: false,
                    message: "A question with this title already exists. Please choose a different title."
                });
            }

            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * updateQuestion - is a function to update a question 
     * in the system by id
     * @param {req} request
     * @param {res} response
     * @returns 
     */
    async updateQuestion(req, res) {
        try {
            const { id } = req.params;
            const { title, body } = req.body;
            const questionId = parseInt(id);
            const userRole = req.user?.Roles?.role_name;
            const userId = req.user?.user_id;

            if (isNaN(questionId)) {
                return res.status(400).json({ success: false, message: "Invalid ID" });
            }

            const isAdmin = userRole === 'admin' || userRole === 'moderator';
            const result = await questionService.updateQuestion(questionId, title, body, userId, isAdmin);

            res.status(200).json({
                success: true,
                message: "Question updated and history saved",
                data: result
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: "Question not found" });
            }
            if (error.message.includes("Unauthorized")) {
                return res.status(403).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Close a question (Admin / Moderator)
     */
    async closeQuestion(req, res) {
        try {
            const { id } = req.params;
            const questionId = parseInt(id);
            const adminId = req.user.user_id;

            if (isNaN(questionId)) {
                return res.status(400).json({ success: false, message: "Invalid question id" });
            }

            const closedQuestion = await questionService.closeQuestion(questionId, adminId);

            res.status(200).json({
                success: true,
                message: "Question closed successfully 🔒",
                data: closedQuestion
            });

        } catch (error) {
            console.error(error);
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
            const page = parseInt(req.query.page) || 1;
            let limit = parseInt(req.query.limit) || 10;

            if (limit > 50) {
                limit = 50;
            }

            const skip = (page - 1) * limit;

            const { questions, totalQuestions, totalPages } = await questionService.getAllQuestions(page, limit);

            const sanitizedQuestions = questions.map(q => {
                const score = (q.Votes || []).reduce((acc, curr) => acc + (curr.vote_type || 0), 0);

                const bodySnippet = q.body.length > 150
                    ? q.body.substring(0, 150) + '...'
                    : q.body;

                const tags = (q.Question_Tags || []).map(qt => qt.Tags.tag_name);

                return {
                    question_id: q.question_id,
                    title: q.title,
                    summary: bodySnippet,
                    views: q.views_count,
                    score: score,
                    answers_count: q._count.Answers,
                    is_closed: q.is_closed,
                    closed_by: q.closed_by,
                    created_at: q.created_at,
                    author: q.Author,
                    tags: tags
                };
            });

            res.status(200).json({
                success: true,
                count: sanitizedQuestions.length,
                total: totalQuestions,
                totalPages: totalPages,
                currentPage: page,
                data: sanitizedQuestions
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * 
     * @param {req} request parameter 
     * @param {res} response parameter 
     * @returns void
     */
    async getQuestionById(req, res) {
        try {
            const { id } = req.params;

            const cookieName = `viewed_${id}`;
            const hasViewed = req.cookies[cookieName];

            const question = await questionService.fetchQuestionById(parseInt(id), !hasViewed);

            if (!question) {
                return res.status(404).json({ success: false, message: "Question not found" });
            }

            if (!hasViewed) {
                res.cookie(cookieName, 'true', { maxAge: 60 * 60 * 1000, httpOnly: true });
            }

            const score = question.Votes ? question.Votes.reduce((acc, curr) => acc + (curr.vote_type || 0), 0) : 0;
            const { Votes, ...questionData } = question;

            res.status(200).json({
                success: true,
                data: { ...questionData, vote_count: score }
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    message: "Question not found"
                });
            }

            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * searchQuestions - is a function responsible for searching in 
     * the database based on the title, username or tag
     * @req : request
     * @res : response
     * returns void
     */
    async searchQuestions(req, res) {
        try {
            const { q } = req.query;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!q) {
                return res.status(400).json({ success: false, message: "Search query 'q' is required" });
            }

            const { questions, total, totalPages } = await questionService.searchQuestions(q, page, limit);

            const formattedQuestions = questions.map(q => {
                const score = q.Votes.reduce((acc, curr) => acc + (curr.vote_type || 0), 0);
                const bodySnippet = q.body.length > 150 ? q.body.substring(0, 150) + '...' : q.body;
                const tags = q.Question_Tags.map(qt => qt.Tags.tag_name);

                return {
                    question_id: q.question_id,
                    title: q.title,
                    summary: bodySnippet,
                    views: q.views_count,
                    score: score,
                    answers_count: q._count.Answers,
                    is_closed: q.is_closed,
                    closed_by: q.closed_by,
                    created_at: q.created_at,
                    author: q.Author,
                    tags: tags
                };
            });

            res.status(200).json({
                success: true,
                count: formattedQuestions.length,
                total: total,
                totalPages: totalPages,
                currentPage: page,
                data: formattedQuestions
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * a function that show us the history of changing this question
     * it is look like a version control
     * @req : is the request
     * @res : is the response
     * returns void
     */
    async getQuestionHistory(req, res) {
        try {
            const { id } = req.params;
            const questionId = parseInt(id);

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (isNaN(questionId)) {
                return res.status(400).json({ success: false, message: "Invalid ID" });
            }

            const { history, totalHistory, totalPages } =
                await questionService.getQuestionHistory(questionId, page, limit);

            res.status(200).json({
                success: true,
                count: history.length,
                total: totalHistory,
                totalPages,
                currentPage: page,
                data: history
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new QuestionController();