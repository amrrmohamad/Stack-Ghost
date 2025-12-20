/**
 * @file authService.js
 * @description Service layer for Authentication operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-20
 */

import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Register a new user
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @param {string} password - User's password (plain text)
 * @returns {Promise<Object>} Created user data
 */
export const registerUser = async (username, email, password) => {
    if (!username || !email || !password) {
        throw new Error('username, email and password are required');
    }

    if (password.length < 10) {
        throw new Error('Password must be at least 10 characters');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = await prisma.users.create({
            data: {
                username,
                email,
                password_hash: hashedPassword,
                is_active: true,
                role_id: 3,
            },
            select: {
                user_id: true,
                username: true,
                email: true,
                role_id: true
            }
        });

        return newUser;
    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('username or email already exists');
        }
        throw error;
    }
};

/**
 * Authenticate user and generate tokens
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} Access and refresh tokens
 */
export const loginUser = async (email, password) => {
    if (!email || !password) {
        throw new Error('email and password required');
    }

    const user = await prisma.users.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
        throw new Error('User is deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = jwt.sign(
        { user_id: user.user_id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { user_id: user.user_id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    // Store refresh token in database
    await prisma.users.update({
        where: { user_id: user.user_id },
        data: {
            refresh_token: refreshToken,
            last_login: new Date()
        }
    });

    return { accessToken, refreshToken };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Current refresh token
 * @returns {Promise<Object>} New access and refresh tokens
 */
export const refreshUserToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error('Refresh token required');
    }

    // Verify token first
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if token exists in database
    const user = await prisma.users.findFirst({
        where: {
            refresh_token: refreshToken,
            user_id: decoded.user_id
        }
    });

    if (!user) {
        throw new Error('Invalid refresh token');
    }

    if (!user.is_active) {
        throw new Error('User is deactivated');
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
        { user_id: decoded.user_id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    // Generate new refresh token (token rotation for security)
    const newRefreshToken = jwt.sign(
        { user_id: decoded.user_id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    // Update refresh token in database
    await prisma.users.update({
        where: { user_id: user.user_id },
        data: { refresh_token: newRefreshToken }
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout user by invalidating refresh token
 * @param {string} refreshToken - Refresh token to invalidate
 * @returns {Promise<boolean>} Success status
 */
export const logoutUser = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error('Refresh token required');
    }

    const user = await prisma.users.findFirst({
        where: { refresh_token: refreshToken }
    });

    if (!user) {
        throw new Error('Invalid token');
    }

    // Remove refresh token
    await prisma.users.update({
        where: { user_id: user.user_id },
        data: { refresh_token: null }
    });

    return true;
};

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (userId) => {
    const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: {
            user_id: true,
            username: true,
            email: true,
            profile_image: true,
            reputation: true,
            is_active: true,
            role_id: true,
            Roles: {
                select: {
                    role_name: true
                }
            }
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

/**
 * Validate password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Match result
 */
export const validatePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
