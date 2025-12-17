/**
 * @file commentRoutes.js
 * @description Routes definitions for Comments API.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import express from 'express';
import CommentController from '../controllers/CommentController.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public: get comments
router.get('/', CommentController.getComments);

// Authenticated: create, update, delete comments
router.post('/', auth, CommentController.createComment);
router.put("/:id", auth, CommentController.updateComment);
router.delete("/:id", auth, CommentController.deleteComment);

export default router;