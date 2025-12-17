import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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

        // TODO: Notification 

    } catch (error) {
        console.error("Error awarding badge:", error);
    }
};