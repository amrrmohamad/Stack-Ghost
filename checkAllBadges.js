/**
 * @file checkAllBadges.js
 * @description Script to check and award Ghost badges for all existing users
 * @usage node checkAllBadges.js
 */

import { PrismaClient } from '@prisma/client';
import { checkGhostBadges } from './utils/badgeService.js';

const prisma = new PrismaClient();

async function checkAllUsersBadges() {
    console.log('Starting badge check for all users...\n');

    try {
        // Get all active users
        const users = await prisma.users.findMany({
            where: { is_active: true },
            select: {
                user_id: true,
                username: true,
                reputation: true
            },
            orderBy: { user_id: 'asc' }
        });

        console.log(`Found ${users.length} active users to check.\n`);

        let checked = 0;
        let awarded = 0;

        for (const user of users) {
            try {
                console.log(`Checking badges for user ${user.user_id} (${user.username}) - Reputation: ${user.reputation}`);
                await checkGhostBadges(user.user_id);
                checked++;
            } catch (error) {
                console.error(`Error checking badges for user ${user.user_id}:`, error.message);
            }
        }

        console.log(`\n✅ Badge check complete!`);
        console.log(`   - Users checked: ${checked}`);
        console.log(`   - Check server logs for awarded badges`);

    } catch (error) {
        console.error('Error in badge check script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllUsersBadges();

