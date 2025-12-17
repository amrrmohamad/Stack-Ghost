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
        const { user_id, question_id, answer_id, vote_type } = req.body;

        if (!user_id || (!question_id && !answer_id) || ![1, -1].includes(vote_type)) {
            return res.status(400).json({ success: false, message: "Invalid vote data provided." });
        }

        try {
            const { actionType } = await voteService.handleVote(user_id, question_id, answer_id, vote_type);

            let message = "";
            if (actionType === "unvote") message = `Vote on ${question_id ? 'question' : 'answer'} removed.`;
            else if (actionType === "flip") message = `Vote on ${question_id ? 'question' : 'answer'} flipped.`;
            else message = `New ${vote_type === 1 ? 'Upvote' : 'Downvote'} recorded.`;

            return res.status(200).json({ 
                success: true, 
                message: message, 
                action: actionType 
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes("own post")) {
                return res.status(403).json({ success: false, message: error.message });
            }
            if (error.message.includes("Invalid")) {
                return res.status(400).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * check if you make a vote in this question before
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     * @returns void
     */
    async checkVoteStatus(req, res) {
        try {
            const { user_id, question_id, answer_id } = req.query;

            if (!user_id || (!question_id && !answer_id)) {
                return res.status(400).json({ success: false, message: "Missing params" });
            }

            const voteType = await voteService.checkVoteStatus(user_id, question_id, answer_id);

            res.status(200).json({
                success: true,
                vote_type: voteType
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * 3. Get User Votes History
     * Method: GET
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getUserVotesHistory(req, res) {
        try {
            const { user_id } = req.params;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const { votes, totalVotes, totalPages } = await voteService.getUserVotesHistory(user_id, page, limit);

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