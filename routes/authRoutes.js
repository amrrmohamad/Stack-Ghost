/**
 * @file authRoutes.js
 * @description Authentication routes for user registration, login, token refresh, and logout.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import express from 'express';
import AuthController from '../controllers/AuthController.js';

const router = express.Router();

/**
 * ========== PUBLIC AUTH ROUTES ==========
 * No authentication middleware required
 */

// User registration
router.post('/register', AuthController.register);

// User login
router.post('/login', AuthController.login);

/**
 * ========== AUTHENTICATED AUTH ROUTES ==========
 * These routes can be called by authenticated users
 */

// Refresh access token using refresh token
router.post('/refresh-token', AuthController.refreshToken);

// Logout user
router.post('/logout', AuthController.logout);

export default router;
