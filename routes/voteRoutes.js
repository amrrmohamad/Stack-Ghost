/**
 * @file voteRoutes.js
 * @description voteRoutes responsible for handling vote CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import express from 'express';
import VoteController from '../controllers/VoteController.js';
import auth from '../middlewares/auth.middleware.js';
import { voteLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// All vote routes require authentication
router.use(auth);

// Vote on a question or answer (rate limited)
router.post('/', voteLimiter, VoteController.handleVote);

// Check vote status
router.get('/status', VoteController.checkVoteStatus);

// Get user's voting history
router.get('/history', VoteController.getUserVotesHistory);

export default router;