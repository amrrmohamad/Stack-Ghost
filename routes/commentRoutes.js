/**
 * @file commentRoutes.js
 * @description Routes definitions for Comments API.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-12
 */

import express from 'express';
import CommentController from '../controllers/CommentController.js';

const router = express.Router();

router.post('/', CommentController.createComment);
router.get('/', CommentController.getComments);

router.put("/:id", CommentController.updateComment);
router.delete("/:id", CommentController.deleteComment);
export default router;