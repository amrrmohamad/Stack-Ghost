/**
 * @file answerRoutes.js
 * @description answerRoutes responsible for handling answers CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import express from 'express';
import AnswerController from '../controllers/AnswerController.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create answer (authenticated user)
router.post('/', auth, AnswerController.createAnswer);

// Get answers for a question
router.get('/:questionId', AnswerController.getQuestionAnswers);

// Accept answer (RESTful: /answers/:id/accept) - question owner only
router.post('/:id/accept', auth, AnswerController.acceptAnswer);

// Update / delete require authentication; ownership enforced in service
router.put('/:id', auth, AnswerController.updateAnswer);
router.delete('/:id', auth, AnswerController.deleteAnswer);
export default router;