/**
 * @file errors.js
 * @description Standardized error messages and error handling utilities
 */

export const ERRORS = {
    // Authentication & Authorization
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Insufficient permissions',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_CREDENTIALS: 'Invalid credentials',
    USER_DEACTIVATED: 'User account is deactivated',
    
    // Generic
    SERVER_ERROR: 'Internal server error',
    INVALID_INPUT: 'Invalid input provided',
    NOT_FOUND: (resource) => `${resource} not found`,
    ALREADY_EXISTS: (resource) => `${resource} already exists`,
    
    // Validation
    MISSING_FIELDS: (fields) => `Missing required fields: ${fields.join(', ')}`,
    INVALID_ID: 'Invalid ID provided',
    TITLE_TOO_LONG: 'Title must be less than 300 characters',
    BODY_TOO_LONG: 'Body must be less than 30000 characters',
    TOO_MANY_TAGS: 'Maximum 5 tags allowed',
    
    // Business Logic
    QUESTION_CLOSED: 'Question is closed',
    CANNOT_VOTE_OWN_POST: 'You cannot vote on your own post',
    ALREADY_ACCEPTED: 'This answer is already accepted',
    CANNOT_ACCEPT_OWN_ANSWER: 'You cannot accept your own answer',
    ONLY_OWNER_CAN_ACCEPT: 'Only the question owner can accept an answer',
    CANNOT_FOLLOW_SELF: 'You cannot follow yourself',
    
    // Rate Limiting
    TOO_MANY_REQUESTS: 'Too many requests, please try again later'
};

export class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
