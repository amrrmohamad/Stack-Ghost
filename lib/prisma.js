/**
 * @file prisma.js
 * @description Singleton PrismaClient instance to prevent connection pool exhaustion
 * @author Stack-Ghost Team
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
