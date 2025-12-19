import prisma from '../lib/prisma.js';
import { createNotification } from './notificationService.js';

export const awardBadge = async (userId, badgeName) => {
    try {
        const badge = await prisma.badges.findUnique({
            where: { badge_name: badgeName }
        });

        if (!badge) return; 

        const alreadyHasIt = await prisma.user_Badges.findUnique({
            where: {
                user_id_badge_id: { 
                    user_id: userId,
                    badge_id: badge.badge_id
                }
            }
        });

        if (alreadyHasIt) return; 

        await prisma.user_Badges.create({
            data: {
                user_id: userId,
                badge_id: badge.badge_id,
                granted_at: new Date()
            }
        });

        console.log(`User ${userId} earned badge: ${badgeName} 🏅`);

        // Create notification for badge award
        await createNotification(
            userId,
            `Congratulations! You earned the "${badgeName}" badge! 🏅`
        );

    } catch (error) {
        console.error("Error awarding badge:", error);
    }
};

/**
 * Check and award Ghost badges (Silver, Gold, Diamond) based on user achievements
 * Each requirement awards a separate badge independently
 */
export const checkGhostBadges = async (userId) => {
    try {
        const userIdInt = parseInt(userId);
        if (isNaN(userIdInt)) {
            console.warn(`Invalid userId for badge check: ${userId}`);
            return;
        }

        // Get user stats
        const user = await prisma.users.findUnique({
            where: { user_id: userIdInt },
            select: {
                reputation: true,
                _count: {
                    select: {
                        AuthoredQuestions: true,
                        Answers: true
                    }
                }
            }
        });

        if (!user) {
            console.warn(`User not found for badge check: ${userIdInt}`);
            return;
        }

        // Count accepted questions (questions where user is owner and has at least one accepted answer)
        const acceptedQuestionsCount = await prisma.questions.count({
            where: {
                user_id: userIdInt,
                Answers: {
                    some: {
                        is_accepted: true
                    }
                }
            }
        });

        // Count accepted answers (answers that are accepted)
        const acceptedAnswersCount = await prisma.answers.count({
            where: {
                user_id: userIdInt,
                is_accepted: true
            }
        });

        const stats = {
            reputation: user.reputation || 0,
            questions: user._count.AuthoredQuestions || 0,
            answers: user._count.Answers || 0,
            acceptedQuestions: acceptedQuestionsCount,
            acceptedAnswers: acceptedAnswersCount
        };

        console.log(`Checking Ghost badges for user ${userIdInt}:`, stats);

        // Silver Ghost badges - check each requirement independently
        if (stats.reputation >= 1000) {
            await awardBadge(userIdInt, 'Silver Ghost (Reputation)');
        }
        if (stats.questions >= 10) {
            await awardBadge(userIdInt, 'Silver Ghost (Questions)');
        }
        if (stats.answers >= 20) {
            await awardBadge(userIdInt, 'Silver Ghost (Answers)');
        }
        if (stats.acceptedQuestions >= 5) {
            await awardBadge(userIdInt, 'Silver Ghost (Accepted Questions)');
        }
        if (stats.acceptedAnswers >= 10) {
            await awardBadge(userIdInt, 'Silver Ghost (Accepted Answers)');
        }

        // Gold Ghost badges - check each requirement independently
        if (stats.reputation >= 5000) {
            await awardBadge(userIdInt, 'Gold Ghost (Reputation)');
        }
        if (stats.questions >= 50) {
            await awardBadge(userIdInt, 'Gold Ghost (Questions)');
        }
        if (stats.answers >= 100) {
            await awardBadge(userIdInt, 'Gold Ghost (Answers)');
        }
        if (stats.acceptedQuestions >= 25) {
            await awardBadge(userIdInt, 'Gold Ghost (Accepted Questions)');
        }
        if (stats.acceptedAnswers >= 50) {
            await awardBadge(userIdInt, 'Gold Ghost (Accepted Answers)');
        }

        // Diamond Ghost badges - check each requirement independently
        if (stats.reputation >= 10000) {
            await awardBadge(userIdInt, 'Diamond Ghost (Reputation)');
        }
        if (stats.questions >= 100) {
            await awardBadge(userIdInt, 'Diamond Ghost (Questions)');
        }
        if (stats.answers >= 200) {
            await awardBadge(userIdInt, 'Diamond Ghost (Answers)');
        }
        if (stats.acceptedQuestions >= 50) {
            await awardBadge(userIdInt, 'Diamond Ghost (Accepted Questions)');
        }
        if (stats.acceptedAnswers >= 100) {
            await awardBadge(userIdInt, 'Diamond Ghost (Accepted Answers)');
        }

    } catch (error) {
        console.error("Error checking Ghost badges:", error);
    }
};