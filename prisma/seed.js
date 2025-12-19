/**
 * @file seed.js
 * @description init the Badges in the system
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding badges...')

  const badges = [
    {
      badge_name: 'Student',
      description: 'Asked first question',
      badge_type: 'BRONZE'
    },
    {
      badge_name: 'Teacher',
      description: 'Answered first question',
      badge_type: 'BRONZE'
    },
    {
      badge_name: 'Nice Answer',
      description: 'Answer score > 10',
      badge_type: 'SILVER'
    },
    {
      badge_name: 'Guru',
      description: 'Answer score > 100',
      badge_type: 'GOLD'
    },
    {
      badge_name: 'Curious',
      description: 'Asked 5 questions',
      badge_type: 'BRONZE'
    },
    {
      badge_name: 'Inquisitive',
      description: 'Asked 30 questions',
      badge_type: 'SILVER'
    }
  ]

  for (const badge of badges) {
    const existingBadge = await prisma.badges.findUnique({
      where: { badge_name: badge.badge_name }
    })

    if (!existingBadge) {
      await prisma.badges.create({
        data: badge
      })
      console.log(`Created badge: ${badge.badge_name}`)
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })