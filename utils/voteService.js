/**
 * @file voteService.js
 * @description Service layer for Vote operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';
import { awardBadge } from './badgeService.js';
import { ERRORS } from '../lib/errors.js';

const REPUTATION_GAINS = {
    UPVOTE_RECEIVED: 10,      // Post owner receives +10 for upvote
    DOWNVOTE_RECEIVED: -2,    // Post owner receives -2 for downvote
    DOWNVOTE_COST: -1         // Voter pays -1 to downvote (anti-abuse)
};

/**
 * Handle vote action (create, update, or remove)
 * FIXED: Race condition resolved by moving all logic inside transaction
 */
export const handleVote = async (userId, questionId, answerId, voteType) => {
    if (!userId || (!questionId && !answerId) || ![1, -1].includes(voteType)) {
        throw new Error('Invalid vote data provided');
    }

    let targetEntity;
    let ownerIdField = 'user_id';
    let ownerModel;
    
    if (questionId) {
        targetEntity = 'question';
        ownerModel = prisma.questions;
    } else {
        targetEntity = 'answer';
        ownerModel = prisma.answers;
    }

    try {
        // Move ALL logic inside transaction to prevent race conditions
        return await prisma.$transaction(async (tx) => {
            // Get post info
            const post = await (targetEntity === 'question' 
                ? tx.questions.findUnique({
                    where: { question_id: parseInt(questionId) },
                    select: { user_id: true, is_closed: true }
                })
                : tx.answers.findUnique({
                    where: { answer_id: parseInt(answerId) },
                    select: { user_id: true }
                })
            );

            if (!post) {
                throw new Error(`${targetEntity} not found`);
            }

            const postOwnerId = post[ownerIdField];

            // Check if question is closed
            if (targetEntity === 'question' && post.is_closed) {
                throw new Error('Cannot vote on closed question');
            }

            if (postOwnerId === parseInt(userId)) {
                throw new Error(ERRORS.CANNOT_VOTE_OWN_POST);
            }

            // Find existing vote INSIDE transaction
            const existingVote = await tx.votes.findFirst({
                where: { 
                    user_id: parseInt(userId), 
                    question_id: questionId ? parseInt(questionId) : null,
                    answer_id: answerId ? parseInt(answerId) : null
                }
            });

            let reputationChangeForOwner = 0;
            let actionType = '';

            if (existingVote) {
                if (existingVote.vote_type === voteType) {
                    // Unvote
                    if (existingVote.vote_type === 1) {
                        reputationChangeForOwner = -REPUTATION_GAINS.UPVOTE_RECEIVED;
                    } else {
                        reputationChangeForOwner = -REPUTATION_GAINS.DOWNVOTE_RECEIVED;
                    }

                    await tx.votes.delete({ where: { vote_id: existingVote.vote_id } });
                    await tx.users.update({
                        where: { user_id: postOwnerId },
                        data: { reputation: { increment: reputationChangeForOwner } }
                    });
                    actionType = 'unvote';

                } else {
                    // Flip vote
                    const oldVoteReputationEffect = existingVote.vote_type === 1
                        ? -REPUTATION_GAINS.UPVOTE_RECEIVED
                        : -REPUTATION_GAINS.DOWNVOTE_RECEIVED;

                    const newVoteReputationEffect = voteType === 1
                        ? REPUTATION_GAINS.UPVOTE_RECEIVED
                        : REPUTATION_GAINS.DOWNVOTE_RECEIVED;

                    reputationChangeForOwner = oldVoteReputationEffect + newVoteReputationEffect;

                    await tx.votes.update({
                        where: { vote_id: existingVote.vote_id },
                        data: { vote_type: voteType }
                    });
                    
                    await tx.users.update({
                        where: { user_id: postOwnerId },
                        data: { reputation: { increment: reputationChangeForOwner } }
                    });
                    actionType = 'flip';
                }
            } else {
                // New vote
                reputationChangeForOwner = voteType === 1
                    ? REPUTATION_GAINS.UPVOTE_RECEIVED
                    : REPUTATION_GAINS.DOWNVOTE_RECEIVED;

                await tx.votes.create({
                    data: {
                        user_id: parseInt(userId),
                        question_id: questionId ? parseInt(questionId) : null,
                        answer_id: answerId ? parseInt(answerId) : null,
                        vote_type: voteType
                    }
                });
                
                await tx.users.update({
                    where: { user_id: postOwnerId },
                    data: { reputation: { increment: reputationChangeForOwner } }
                });
                actionType = 'new_vote';
            }

            // Award badges for answers (inside transaction is better)
            if (targetEntity === 'answer') {
                try {
                    const aggregation = await tx.votes.aggregate({
                        where: { answer_id: parseInt(answerId) },
                        _sum: { vote_type: true }
                    });
                    
                    const score = aggregation._sum.vote_type || 0;

                    if (score >= 10) {
                        await awardBadge(postOwnerId, 'Nice Answer');
                    }

                    if (score >= 100) {
                        await awardBadge(postOwnerId, 'Guru');
                    }

                } catch (badgeError) {
                    console.error("Badge Check Error:", badgeError);
                }
            }

            let message = '';
            if (actionType === 'unvote') message = `Vote on ${targetEntity} removed`;
            else if (actionType === 'flip') message = `Vote on ${targetEntity} flipped`;
            else message = `New ${voteType === 1 ? 'Upvote' : 'Downvote'} recorded`;

            return { action: actionType, message };
        });

    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('You have already cast a vote on this item');
        }
        throw error;
    }
};

/**
 * Check if user has voted on something
 */
export const checkVoteStatus = async (userId, questionId = null, answerId = null) => {
    if (!userId || (!questionId && !answerId)) {
        throw new Error('Missing required parameters');
    }

    const whereClause = {
        user_id: parseInt(userId),
        ...(questionId && { question_id: parseInt(questionId) }),
        ...(answerId && { answer_id: parseInt(answerId) })
    };

    const vote = await prisma.votes.findFirst({
        where: whereClause
    });

    return vote ? vote.vote_type : null;
};

/**
 * Get user's voting history
 */
export const getUserVotesHistory = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const totalVotes = await prisma.votes.count({
        where: { user_id: parseInt(userId) }
    });

    const votes = await prisma.votes.findMany({
        where: { user_id: parseInt(userId) },
        skip,
        take: limit,
        include: {
            Questions: {
                select: { title: true, question_id: true }
            },
            Answers: {
                select: { body: true, answer_id: true, question_id: true }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return { votes, totalVotes, totalPages: Math.ceil(totalVotes / limit) };
};

/**
 * Get total votes on a question
 */
export const getQuestionVoteCount = async (questionId) => {
    const votes = await prisma.votes.aggregate({
        where: { question_id: parseInt(questionId) },
        _sum: { vote_type: true },
        _count: true
    });

    return {
        totalVotes: votes._count,
        score: votes._sum.vote_type || 0
    };
};

/**
 * Get total votes on an answer
 */
export const getAnswerVoteCount = async (answerId) => {
    const votes = await prisma.votes.aggregate({
        where: { answer_id: parseInt(answerId) },
        _sum: { vote_type: true },
        _count: true
    });

    return {
        totalVotes: votes._count,
        score: votes._sum.vote_type || 0
    };
};
