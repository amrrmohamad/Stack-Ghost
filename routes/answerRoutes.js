/**
 * @file answerRoutes.js
 * @description answerRoutes responsible for handling answers CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import express from 'express';
import AnswerController from '../controllers/AnswerController.js';
import auth from '../middlewares/auth.middleware.js';
import { createLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public: Get answers for a question
router.get('/:questionId', AnswerController.getQuestionAnswers);

// Authenticated: Create answer (rate limited)
router.post('/', auth, createLimiter, AnswerController.createAnswer);

// Authenticated: Accept answer (question owner only)
router.post('/:id/accept', auth, AnswerController.acceptAnswer);

// Authenticated: Update / delete (ownership enforced in service)
router.put('/:id', auth, AnswerController.updateAnswer);
router.delete('/:id', auth, AnswerController.deleteAnswer);

export default router;