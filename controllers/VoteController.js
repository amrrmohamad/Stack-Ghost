/**
 * @file VoteController.js
 * @description Controller responsible for handling Votes CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-16
 */
import * as voteService from '../utils/voteService.js';

class VoteController {
    /**
     * Handle upvote/downvote action on a Question or Answer.
     * Uses a Prisma Transaction to ensure data consistency (Vote + Reputation update).
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async handleVote(req, res) {
        try {
            const { question_id, answer_id, vote_type } = req.body;
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            if ((!question_id && !answer_id) || ![1, -1].includes(vote_type)) {
                return res.status(400).json({ success: false, message: "Invalid vote data provided." });
            }

            const result = await voteService.handleVote(userId, question_id, answer_id, vote_type);

            return res.status(200).json({ 
                success: true, 
                message: result.message, 
                action: result.action
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes("own post")) {
                return res.status(403).json({ success: false, message: error.message });
            }
            if (error.message.includes("Invalid") || error.message.includes("Missing")) {
                return res.status(400).json({ success: false, message: error.message });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Check if user has voted on a question or answer
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async checkVoteStatus(req, res) {
        try {
            const { question_id, answer_id } = req.query;
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            if (!question_id && !answer_id) {
                return res.status(400).json({ success: false, message: "Missing question_id or answer_id" });
            }

            const voteType = await voteService.checkVoteStatus(userId, question_id, answer_id);

            res.status(200).json({
                success: true,
                vote_type: voteType
            });

        } catch (error) {
            if (error.message.includes("Missing") || error.message.includes("Invalid")) {
                return res.status(400).json({ success: false, message: error.message });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get authenticated user's voting history
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getUserVotesHistory(req, res) {
        try {
            const userId = req.user?.user_id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const { votes, totalVotes, totalPages } = await voteService.getUserVotesHistory(userId, page, limit);

            res.status(200).json({
                success: true,
                count: votes.length,
                total: totalVotes,
                totalPages: totalPages,
                currentPage: page,
                data: votes
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new VoteController();