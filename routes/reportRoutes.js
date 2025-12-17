/**
 * @file reportRoutes.js
 * @description Routes responsible for handling Report CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import express from 'express';
import ReportController from '../controllers/ReportController.js';
import auth from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// Create a new report (authenticated users)
router.post('/', auth, ReportController.createReport);

// Admin/Moderator only routes
router.get('/', auth, authorizeRoles('admin', 'moderator'), ReportController.getAllReports);
router.get('/status/:status', auth, authorizeRoles('admin', 'moderator'), ReportController.getReportsByStatus);
router.get('/:id', auth, authorizeRoles('admin', 'moderator'), ReportController.getReportById);
router.put('/:id/status', auth, authorizeRoles('admin', 'moderator'), ReportController.updateReportStatus);
router.delete('/:id', auth, authorizeRoles('admin', 'moderator'), ReportController.deleteReport);

export default router;
