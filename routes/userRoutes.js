/**
 * @file userRoutes.js
 * @description userRoutes responsible for handling User CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import express from 'express';
import UserController from '../controllers/UserController.js';

const router = express.Router();

// لما حد يطلب اللينك ده GET، شغل دالة getAllUsers
router.get('/', UserController.getAllUsers);

// لما حد يبعت داتا POST، شغل دالة createUser
router.post('/', UserController.createUser);

router.get('/:id', UserController.getUserById);

router.put('/:id', UserController.updateUser);

router.delete('/:id', UserController.deleteUser);
export default router;