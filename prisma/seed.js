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
      badge_type: 'SILVER'
    },
    {
      badge_name: 'Teacher',
      description: 'Answered first question',
      badge_type: 'SILVER'
    },
    {
      badge_name: 'Nice Answer',
      description: 'Answer score > 10',
      badge_type: 'GOLD'
    },
    {
      badge_name: 'Guru',
      description: 'Answer score > 100',
      badge_type: 'DIAMOND'
    },
    {
      badge_name: 'Curious',
      description: 'Asked 5 questions',
      badge_type: 'SILVER'
    },
    {
      badge_name: 'Inquisitive',
      description: 'Asked 30 questions',
      badge_type: 'GOLD'
    },
    // Silver Ghost badges - each requirement awards separately
    {
      badge_name: 'Silver Ghost (Reputation)',
      description: 'Reached 1,000 reputation points',
      badge_type: 'SILVER'
    },
    {
      badge_name: 'Silver Ghost (Questions)',
      description: 'Asked 10 questions',
      badge_type: 'SILVER'
    },
    {
      badge_name: 'Silver Ghost (Answers)',
      description: 'Answered 20 questions',
      badge_type: 'SILVER'
    },
    {
      badge_name: 'Silver Ghost (Accepted Questions)',
      description: 'Accepted answers on 5 questions',
      badge_type: 'SILVER'
    },
    {
      badge_name: 'Silver Ghost (Accepted Answers)',
      description: 'Had 10 answers accepted',
      badge_type: 'SILVER'
    },
    // Gold Ghost badges - each requirement awards separately
    {
      badge_name: 'Gold Ghost (Reputation)',
      description: 'Reached 5,000 reputation points',
      badge_type: 'GOLD'
    },
    {
      badge_name: 'Gold Ghost (Questions)',
      description: 'Asked 50 questions',
      badge_type: 'GOLD'
    },
    {
      badge_name: 'Gold Ghost (Answers)',
      description: 'Answered 100 questions',
      badge_type: 'GOLD'
    },
    {
      badge_name: 'Gold Ghost (Accepted Questions)',
      description: 'Accepted answers on 25 questions',
      badge_type: 'GOLD'
    },
    {
      badge_name: 'Gold Ghost (Accepted Answers)',
      description: 'Had 50 answers accepted',
      badge_type: 'GOLD'
    },
    // Diamond Ghost badges - each requirement awards separately
    {
      badge_name: 'Diamond Ghost (Reputation)',
      description: 'Reached 10,000 reputation points',
      badge_type: 'DIAMOND'
    },
    {
      badge_name: 'Diamond Ghost (Questions)',
      description: 'Asked 100 questions',
      badge_type: 'DIAMOND'
    },
    {
      badge_name: 'Diamond Ghost (Answers)',
      description: 'Answered 200 questions',
      badge_type: 'DIAMOND'
    },
    {
      badge_name: 'Diamond Ghost (Accepted Questions)',
      description: 'Accepted answers on 50 questions',
      badge_type: 'DIAMOND'
    },
    {
      badge_name: 'Diamond Ghost (Accepted Answers)',
      description: 'Had 100 answers accepted',
      badge_type: 'DIAMOND'
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