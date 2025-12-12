/**
 * @file answerRoutes.js
 * @description answerRoutes responsible for handling answers CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import express from 'express';
import AnswerController from '../controllers/AnswerController.js';

const router = express.Router();

router.post('/answers', AnswerController.createAnswer);


router.get('/answers/:questionId', AnswerController.getQuestionAnswers);

export default router;