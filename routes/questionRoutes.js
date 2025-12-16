/**
 * @file questionRoutes.js
 * @description questionRoutes responsible for handling question CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */
import express from 'express';
import QuestionController from '../controllers/QuestionController.js';
import auth from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// Public search
router.get('/search', QuestionController.searchQuestions);

// Public: get all questions
router.get('/', QuestionController.getAllQuestions);

// Public: get question by id
router.get('/:id', QuestionController.getQuestionById);

// Public: get question history
router.get('/history/:id', QuestionController.getQuestionHistory);

// Authenticated: create question
router.post('/', auth, QuestionController.createQuestion);

// Authenticated: update question (owner or admin)
router.put('/:id', auth, QuestionController.updateQuestion);

// Authenticated: close question (admin or moderator)
router.patch('/:id/close', auth, authorizeRoles('admin', 'moderator'), QuestionController.closeQuestion);



export default router;