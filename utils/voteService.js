/**
 * @file voteService.js
 * @description Service layer for Vote operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import { PrismaClient } from '@prisma/client';
import { awardBadge } from './badgeService.js';

const prisma = new PrismaClient();

const REPUTATION_GAINS = {
    UPVOTE_QUESTION: 10,
    UPVOTE_ANSWER: 10,
    DOWNVOTE_QUESTION: -2,
    DOWNVOTE_ANSWER: -2,
    RECEIVED_DOWNVOTE: -2,
    UNVOTE: 0
};

/**
 * Handle vote action (create, update, or remove)
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
        const post = await ownerModel.findUnique({
            where: { [targetEntity + '_id']: questionId || answerId },
            select: { [ownerIdField]: true }
        });

        if (!post) {
            throw new Error(`${targetEntity} not found`);
        }

        const postOwnerId = post[ownerIdField];

        if (postOwnerId === parseInt(userId)) {
            throw new Error('You cannot vote on your own post');
        }

        const existingVote = await prisma.votes.findFirst({
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
                actionType = 'unvote';

            } else {
                // Flip vote
                const oldVoteReputationEffect = existingVote.vote_type === 1
                    ? -REPUTATION_GAINS.UPVOTE_QUESTION
                    : -REPUTATION_GAINS.RECEIVED_DOWNVOTE;

                const newVoteReputationEffect = voteType === 1
                    ? REPUTATION_GAINS.UPVOTE_QUESTION
                    : REPUTATION_GAINS.RECEIVED_DOWNVOTE;

                reputationChangeForOwner = oldVoteReputationEffect + newVoteReputationEffect;

                await prisma.$transaction([
                    prisma.votes.update({
                        where: { vote_id: existingVote.vote_id },
                        data: { vote_type: voteType }
                    }),
                    prisma.users.update({
                        where: { user_id: postOwnerId },
                        data: { reputation: { increment: reputationChangeForOwner } }
                    })
                ]);
                actionType = 'flip';
            }
        } else {
            // New vote
            reputationChangeForOwner = voteType === 1
                ? REPUTATION_GAINS.UPVOTE_QUESTION
                : REPUTATION_GAINS.RECEIVED_DOWNVOTE;

            await prisma.$transaction([
                prisma.votes.create({
                    data: {
                        user_id: parseInt(userId),
                        question_id: questionId ? parseInt(questionId) : null,
                        answer_id: answerId ? parseInt(answerId) : null,
                        vote_type: voteType
                    }
                }),
                prisma.users.update({
                    where: { user_id: postOwnerId },
                    data: { reputation: { increment: reputationChangeForOwner } }
                })
            ]);
            actionType = 'new_vote';
        }

        // Award badges for answers
        if (targetEntity === 'answer') {
            (async () => {
                try {
                    const aggregation = await prisma.votes.aggregate({
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
            })();
        }

        let message = '';
        if (actionType === 'unvote') message = `Vote on ${targetEntity} removed`;
        else if (actionType === 'flip') message = `Vote on ${targetEntity} flipped`;
        else message = `New ${voteType === 1 ? 'Upvote' : 'Downvote'} recorded`;

        return { action: actionType, message };

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
