/**
 * @file authRoutes.js
 * @description Authentication routes for user registration, login, token refresh, and logout.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * ========== PUBLIC AUTH ROUTES ==========
 * Rate limited to prevent brute force attacks
 */

// User registration
router.post('/register', authLimiter, AuthController.register);

// User login
router.post('/login', authLimiter, AuthController.login);

/**
 * ========== TOKEN ROUTES ==========
 */

// Refresh access token using refresh token
router.post('/refresh-token', AuthController.refreshToken);

// Logout user
router.post('/logout', AuthController.logout);

export default router;
