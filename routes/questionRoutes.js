/**
 * @file questionRoutes.js
 * @description questionRoutes responsible for handling question CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */
import express from 'express';
import QuestionController from '../controllers/QuestionController.js';
import auth from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { createLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public search
router.get('/search', QuestionController.searchQuestions);

// Public: get all questions
router.get('/', QuestionController.getAllQuestions);

// Public: get questions by tag
router.get('/tag/:tagId', QuestionController.getQuestionsByTag);

// Public: get question history
router.get('/history/:id', QuestionController.getQuestionHistory);

// Public: get question by id (must be last GET route to avoid conflicts)
router.get('/:id', QuestionController.getQuestionById);

// Authenticated: create question (rate limited)
router.post('/', auth, createLimiter, QuestionController.createQuestion);

// Authenticated: update question (owner or admin)
router.put('/:id', auth, QuestionController.updateQuestion);

// Authenticated: close question (admin or moderator)
router.patch('/:id/close', auth, authorizeRoles('admin', 'moderator'), QuestionController.closeQuestion);

export default router;