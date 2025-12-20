/**
 * @file rateLimiter.js
 * @description Rate limiting middleware to prevent abuse
 */

import rateLimit from 'express-rate-limit';
import { ERRORS } from '../lib/errors.js';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // limit each IP to 10000 requests per windowMs
    message: { success: false, message: ERRORS.TOO_MANY_REQUESTS },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for write operations
export const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 creates per hour
    message: { success: false, message: 'Too many items created, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter (login, register)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 attempts per 15 minutes
    message: { success: false, message: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Vote rate limiter
export const voteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 votes per minute
    message: { success: false, message: 'Too many votes, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
});

