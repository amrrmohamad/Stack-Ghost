/**
 * @file profileService.js
 * @description Service layer for User Profile operations
 * @author Stack-Ghost Team
 * @version 1.0.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';

/**
 * Get complete user profile with all related data
 */
export const getUserProfile = async (userId) => {
    const user = await prisma.users.findUnique({
        where: { user_id: parseInt(userId) },
        select: {
            user_id: true,
            username: true,
            email: true,
            bio: true,
            profile_image: true,
            reputation: true,
            created_at: true,
            is_active: true,
            Roles: {
                select: { role_name: true }
            },
            _count: {
                select: {
                    Answers: true,
                    AuthoredQuestions: true
                }
            }
        }
    });

    if (!user || !user.is_active) {
        throw new Error('User not found');
    }

    return user;
};

/**
 * Get user badges
 */
export const getUserBadges = async (userId) => {
    const badges = await prisma.user_Badges.findMany({
        where: { user_id: parseInt(userId) },
        include: {
            Badges: {
                select: {
                    badge_id: true,
                    badge_name: true,
                    badge_type: true,
                    description: true,
                    icon: true
                }
            }
        },
        orderBy: {
            granted_at: 'desc'
        }
    });

    return badges.map(ub => ({
        badge_id: ub.Badges.badge_id,
        badge_name: ub.Badges.badge_name,
        badge_type: ub.Badges.badge_type,
        description: ub.Badges.description,
        icon: ub.Badges.icon,
        granted_at: ub.granted_at
    }));
};

/**
 * Get user's questions
 */
export const getUserQuestions = async (userId, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
        prisma.questions.findMany({
            where: { user_id: parseInt(userId) },
            skip,
            take: limit,
            select: {
                question_id: true,
                title: true,
                body: true,
                views_count: true,
                is_closed: true,
                created_at: true,
                updated_at: true,
                Question_Tags: {
                    include: {
                        Tags: {
                            select: { tag_name: true }
                        }
                    }
                },
                _count: {
                    select: {
                        Answers: true,
                        Votes: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        }),
        prisma.questions.count({
            where: { user_id: parseInt(userId) }
        })
    ]);

    // Calculate vote scores
    const questionsWithScores = await Promise.all(
        questions.map(async (q) => {
            const votes = await prisma.votes.findMany({
                where: { question_id: q.question_id },
                select: { vote_type: true }
            });
            const score = votes.reduce((sum, v) => sum + (v.vote_type || 0), 0);

            return {
                question_id: q.question_id,
                title: q.title,
                body: q.body,
                summary: q.body.length > 150 ? q.body.substring(0, 150) + '...' : q.body,
                votes: score,
                answers: q._count.Answers,
                views: q.views_count,
                tags: q.Question_Tags.map(qt => qt.Tags.tag_name),
                is_closed: q.is_closed,
                created_at: q.created_at,
                updated_at: q.updated_at,
                createdAt: new Date(q.created_at).getTime()
            };
        })
    );

    return {
        questions: questionsWithScores,
        total,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get user's answers
 */
export const getUserAnswers = async (userId, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;

    const [answers, total] = await Promise.all([
        prisma.answers.findMany({
            where: { user_id: parseInt(userId) },
            skip,
            take: limit,
            include: {
                Questions: {
                    select: {
                        question_id: true,
                        title: true
                    }
                },
                Votes: {
                    select: { vote_type: true }
                }
            },
            orderBy: { created_at: 'desc' }
        }),
        prisma.answers.count({
            where: { user_id: parseInt(userId) }
        })
    ]);

    const answersWithScores = answers.map(a => {
        const score = a.Votes.reduce((sum, v) => sum + (v.vote_type || 0), 0);
        const bodySnippet = a.body.length > 200 ? a.body.substring(0, 200) + '...' : a.body;

        return {
            answer_id: a.answer_id,
            body: a.body,
            snippet: bodySnippet,
            excerpt: bodySnippet,
            question_id: a.Questions.question_id,
            questionTitle: a.Questions.title,
            votes: score,
            is_accepted: a.is_accepted,
            created_at: a.created_at,
            updated_at: a.updated_at,
            createdAt: new Date(a.created_at).getTime()
        };
    });

    return {
        answers: answersWithScores,
        total,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get tags user follows with post counts
 */
export const getUserFollowedTags = async (userId) => {
    const followedTags = await prisma.follow_Tags.findMany({
        where: { user_id: parseInt(userId) },
        include: {
            Tags: {
                select: {
                    tag_id: true,
                    tag_name: true,
                    description: true
                }
            }
        }
    });

    // Get post count for each tag (questions using this tag by this user)
    const tagsWithCounts = await Promise.all(
        followedTags.map(async (ft) => {
            const postCount = await prisma.question_Tags.count({
                where: {
                    tag_id: ft.tag_id,
                    Questions: {
                        user_id: parseInt(userId)
                    }
                }
            });

            return {
                tag_id: ft.Tags.tag_id,
                tag_name: ft.Tags.tag_name,
                description: ft.Tags.description,
                posts: postCount
            };
        })
    );

    return tagsWithCounts;
};

/**
 * Get user's question titles for profile tab
 */
export const getUserQuestionTitles = async (userId, limit = 10) => {
    const questions = await prisma.questions.findMany({
        where: { user_id: parseInt(userId) },
        take: limit,
        select: {
            question_id: true,
            title: true
        },
        orderBy: { created_at: 'desc' }
    });

    return questions.map(q => ({
        question_id: q.question_id,
        title: q.title,
        url: `../questions/index.html?id=${q.question_id}`
    }));
};
