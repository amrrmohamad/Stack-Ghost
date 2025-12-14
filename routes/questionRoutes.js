/**
 * @file questionRoutes.js
 * @description questionRoutes responsible for handling question CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */
import express from 'express';
import QuestionController from '../controllers/QuestionController.js';

const router = express.Router();

router.post('/questions', QuestionController.createQuestion);
router.get('/questions', QuestionController.getAllQuestions);
router.get('/questions/:id', QuestionController.getQuestionById);
export default router;