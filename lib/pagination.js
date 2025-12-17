/**
 * @file pagination.js
 * @description Pagination utility to avoid duplicate code
 */

import prisma from './prisma.js';

/**
 * Generic pagination helper
 * @param {string} model - Prisma model name (e.g., 'questions', 'users')
 * @param {object} where - Where clause for filtering
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {object} options - Additional options (include, orderBy, select)
 * @returns {Promise<object>} Paginated results
 */
export const paginate = async (model, where = {}, page = 1, limit = 10, options = {}) => {
    // Enforce maximum limit
    const maxLimit = 100;
    const safeLimit = Math.min(Math.max(1, parseInt(limit)), maxLimit);
    const safePage = Math.max(1, parseInt(page));
    const skip = (safePage - 1) * safeLimit;
    
    const { include, orderBy, select } = options;
    
    const [results, total] = await Promise.all([
        prisma[model].findMany({
            where,
            skip,
            take: safeLimit,
            ...(include && { include }),
            ...(orderBy && { orderBy }),
            ...(select && { select })
        }),
        prisma[model].count({ where })
    ]);
    
    return {
        results,
        total,
        totalPages: Math.ceil(total / safeLimit),
        currentPage: safePage,
        count: results.length
    };
};

/**
 * Validate and sanitize pagination parameters
 * @param {object} query - Request query object
 * @returns {object} Sanitized page and limit
 */
export const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(query.limit) || 10), 100);
    
    return { page, limit };
};
