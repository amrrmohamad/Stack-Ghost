/**
 * @file ReportController.js
 * @description Controller responsible for handling Report CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.2.0
 * @date 2025-12-17
 */

import * as reportService from '../utils/reportService.js';

class ReportController {
    /**
     * Get all reports with pagination and filtering
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getAllReports(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const status = req.query.status || null;

            const { reports, totalReports, totalPages } =
                await reportService.getAllReports(page, limit, status);

            res.status(200).json({
                success: true,
                count: reports.length,
                total: totalReports,
                totalPages,
                currentPage: page,
                data: reports
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get a single report by ID
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getReportById(req, res) {
        try {
            const reportId = parseInt(req.params.id);

            if (!reportId) {
                return res.status(400).json({
                    success: false,
                    message: "Report ID is required"
                });
            }

            const report = await reportService.getReportById(reportId);

            res.status(200).json({
                success: true,
                data: report
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Create a new report
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async createReport(req, res) {
        try {
            const userId = req.user?.user_id || req.body.userId;
            const { reason, questionId, answerId, question_id, answer_id } = req.body;

            // Support both camelCase and snake_case from frontend
            const qId = questionId || question_id;
            const aId = answerId || answer_id;

            const report = await reportService.createReport(userId, reason, qId, aId);

            res.status(201).json({
                success: true,
                message: "Report created successfully",
                data: report
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes('required')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message.includes('must be provided')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Update report status
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async updateReportStatus(req, res) {
        try {
            const reportId = parseInt(req.params.id);
            const { status } = req.body;

            if (!reportId) {
                return res.status(400).json({
                    success: false,
                    message: "Report ID is required"
                });
            }

            const report = await reportService.updateReportStatus(reportId, status);

            res.status(200).json({
                success: true,
                message: "Report status updated successfully",
                data: report
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }
            if (error.message.includes('Invalid status') || error.message.includes('required')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get reports by status
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getReportsByStatus(req, res) {
        try {
            const status = req.params.status;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const { reports, totalReports, totalPages } =
                await reportService.getReportsByStatus(status, page, limit);

            res.status(200).json({
                success: true,
                count: reports.length,
                total: totalReports,
                totalPages,
                currentPage: page,
                status,
                data: reports
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes('Invalid status')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Delete a report
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async deleteReport(req, res) {
        try {
            const reportId = parseInt(req.params.id);

            if (!reportId) {
                return res.status(400).json({
                    success: false,
                    message: "Report ID is required"
                });
            }

            const report = await reportService.deleteReport(reportId);

            res.status(200).json({
                success: true,
                message: "Report deleted successfully",
                data: report
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get report statistics
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getReportStats(req, res) {
        try {
            const stats = await reportService.getReportStats();

            res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get recent reports
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getRecentReports(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const reports = await reportService.getRecentReports(limit);

            res.status(200).json({
                success: true,
                count: reports.length,
                data: reports
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new ReportController();
