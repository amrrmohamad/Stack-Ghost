/**
 * @file reportRoutes.js
 * @description Routes responsible for handling Report CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import express from 'express';
import ReportController from '../controllers/ReportController.js';

const router = express.Router();

// Get all reports with pagination and filtering
router.get('/', ReportController.getAllReports);

// Get reports by status
router.get('/status/:status', ReportController.getReportsByStatus);

// Get a single report by ID
router.get('/:id', ReportController.getReportById);

// Create a new report
router.post('/', ReportController.createReport);

// Update report status
router.put('/:id/status', ReportController.updateReportStatus);

// Delete a report
router.delete('/:id', ReportController.deleteReport);

export default router;
