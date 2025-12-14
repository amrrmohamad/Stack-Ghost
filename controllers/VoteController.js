/**
 * @file VoteController.js
 * @description Controller responsible for handling Votes CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-13
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const REPUTATION_GAINS = {
    UPVOTE_QUESTION: 10,
    UPVOTE_ANSWER: 10,
    DOWNVOTE_QUESTION: -2,
    DOWNVOTE_ANSWER: -2,
    RECEIVED_DOWNVOTE: -2,
    UNVOTE: 0
};

class VoteController {
    /**
     * Handle upvote/downvote action on a Question or Answer.
     * Uses a Prisma Transaction to ensure data consistency (Vote + Reputation update).
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async handleVote(req, res) {
        const { user_id, question_id, answer_id, vote_type } = req.body; // vote_type هيكون 1 أو -1

        if (!user_id || (!question_id && !answer_id) || ![1, -1].includes(vote_type)) {
            return res.status(400).json({ success: false, message: "Invalid vote data provided." });
        }

        let targetEntity;
        let ownerIdField;
        let ownerModel;
        let voteTypeKey;

        if (question_id) {
            targetEntity = 'question';
            ownerIdField = 'user_id';
            ownerModel = prisma.questions;
            voteTypeKey = vote_type === 1 ? 'UPVOTE_QUESTION' : 'DOWNVOTE_QUESTION';
        } else {
            targetEntity = 'answer';
            ownerIdField = 'user_id';
            ownerModel = prisma.answers;
            voteTypeKey = vote_type === 1 ? 'UPVOTE_ANSWER' : 'DOWNVOTE_ANSWER';
        }

        try {
            const post = await ownerModel.findUnique({
                where: { [targetEntity + '_id']: question_id || answer_id },
                select: { [ownerIdField]: true }
            });

            if (!post) {
                return res.status(404).json({ success: false, message: `${targetEntity} not found.` });
            }

            const postOwnerId = post[ownerIdField];

            if (postOwnerId === user_id) {
                return res.status(403).json({ success: false, message: "You cannot vote on your own post." });
            }

            const existingVote = await prisma.votes.findFirst({
                where: { user_id, question_id, answer_id }
            });

            // -----------------------------------------------------
            //                    Transaction
            // -----------------------------------------------------

            let reputationChangeForOwner = 0;

            if (existingVote) {
                if (existingVote.vote_type === vote_type) {
                    if (existingVote.vote_type === 1) {
                        reputationChangeForOwner = -REPUTATION_GAINS.UPVOTE_QUESTION;
                    } else {
                        reputationChangeForOwner = -REPUTATION_GAINS.RECEIVED_DOWNVOTE;
                    }

                    await prisma.$transaction([
                        prisma.votes.delete({ where: { vote_id: existingVote.vote_id } }),
                        prisma.users.update({
                            where: { user_id: postOwnerId },
                            data: { reputation: { increment: reputationChangeForOwner } }
                        })
                    ]);
                    return res.status(200).json({ success: true, message: `Vote on ${targetEntity} removed. Reputation adjusted.`, action: "unvote" });

                } else {

                    const oldVoteReputationEffect = existingVote.vote_type === 1
                        ? -REPUTATION_GAINS.UPVOTE_QUESTION
                        : -REPUTATION_GAINS.RECEIVED_DOWNVOTE;

                    const newVoteReputationEffect = vote_type === 1
                        ? REPUTATION_GAINS.UPVOTE_QUESTION
                        : REPUTATION_GAINS.RECEIVED_DOWNVOTE;

                    reputationChangeForOwner = oldVoteReputationEffect + newVoteReputationEffect;

                    await prisma.$transaction([
                        prisma.votes.update({
                            where: { vote_id: existingVote.vote_id },
                            data: { vote_type }
                        }),
                        prisma.users.update({
                            where: { user_id: postOwnerId },
                            data: { reputation: { increment: reputationChangeForOwner } }
                        })
                    ]);
                    return res.status(200).json({ success: true, message: `Vote on ${targetEntity} flipped. Reputation adjusted.`, action: "flip" });
                }
            } else {
                reputationChangeForOwner = vote_type === 1
                    ? REPUTATION_GAINS.UPVOTE_QUESTION
                    : REPUTATION_GAINS.RECEIVED_DOWNVOTE;

                await prisma.$transaction([
                    prisma.votes.create({
                        data: {
                            user_id,
                            question_id,
                            answer_id,
                            vote_type
                        }
                    }),
                    prisma.users.update({
                        where: { user_id: postOwnerId },
                        data: { reputation: { increment: reputationChangeForOwner } }
                    })
                ]);
                return res.status(201).json({ success: true, message: `New ${vote_type === 1 ? 'Upvote' : 'Downvote'} recorded. Reputation updated.`, action: "new_vote" });
            }

        } catch (error) {
            console.error(error);
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: "You have already cast a vote on this item." });
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

            const whereClause = {
                user_id: parseInt(user_id),
                ...(question_id && { question_id: parseInt(question_id) }),
                ...(answer_id && { answer_id: parseInt(answer_id) })
            };

            const vote = await prisma.votes.findFirst({
                where: whereClause
            });

            res.status(200).json({
                success: true,
                vote_type: vote ? vote.vote_type : null
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

            const votes = await prisma.votes.findMany({
                where: { user_id: parseInt(user_id) },
                include: {
                    Questions: { select: { title: true, question_id: true } }, 
                    Answers: { select: { body: true, answer_id: true } }
                },
                orderBy: { created_at: 'desc' } 
            });

            res.status(200).json({
                success: true,
                count: votes.length,
                data: votes
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new VoteController();