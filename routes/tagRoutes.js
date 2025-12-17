/**
 * @file tagRoutes.js
 * @description tagRoutes responsible for handling tag CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import express from 'express';
import TagController from '../controllers/TagController.js';
import auth from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();
// get all tags
router.get('/', TagController.getAllTags);


// ======= ADMIN AND MODERATOR ONLY ======

// create tag
router.post(
    '/',
    auth,
    authorizeRoles('admin', 'moderator'),
    TagController.createTag
);

// update tag
router.put(
    '/:id',
    auth,
    authorizeRoles('admin', 'moderator'),
    TagController.updateTag
);

// delete tag
router.delete(
    '/:id',
    auth,
    authorizeRoles('admin'),
    TagController.deleteTag
);

export default router;
