/**
 * @file userRoutes.js
 * @description userRoutes responsible for handling User CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import express from 'express';
import UserController from '../controllers/UserController.js';
import auth from '../middlewares/auth.middleware.js';
import checkPermission from '../middlewares/permission.middleware.js';

const router = express.Router();

/**
 * ========== USER ROUTES ==========
 * NOTE: /me routes must come before /:id routes to avoid route conflicts
 */

// Get current logged-in user's profile
router.get('/me', auth, UserController.getCurrentUser);

// Update current user's profile
router.put('/me', auth, UserController.updateProfile);

/**
 * ========== ADMIN ROUTES ==========
 */

// Get all users (public for user listing page, but with limited data)
// Admin gets full access, regular users get public data
router.get('/', auth, UserController.getAllUsers);

// Search users by username
router.get('/search', auth, UserController.searchUsers);

// Update user state (activate/deactivate)
router.patch('/:id/state', auth, checkPermission('manage_users'), UserController.updateUserState);

/**
 * ========== PUBLIC USER ROUTES ==========
 */

// Get complete profile with all data (badges, questions, answers, tags, stats)
// MUST come before /:id to avoid route conflicts
router.get('/:id/profile', auth, UserController.getCompleteProfile);

// Get public profile of another user
router.get('/:id', auth, UserController.getUserProfile);

export default router;