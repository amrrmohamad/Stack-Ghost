/**
 * @file tagRoutes.js
 * @description tagRoutes responsible for handling tag CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import express from 'express';
import TagController from '../controllers/TagController.js';

const router = express.Router();

router.post('/tags', TagController.createTag);
router.get('/tags', TagController.getAllTags);

export default router;