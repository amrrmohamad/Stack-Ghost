/**
 * @file ReportController.js
 * @description Controller responsible for handling Report CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';
import { ERRORS } from '../lib/errors.js';

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
            const skip = (page - 1) * limit;

            const where = {};
            if (status) {
                where.status = status;
            }

            const totalReports = await prisma.reports.count({ where });

            const reports = await prisma.reports.findMany({
                where,
                skip,
                take: limit,
                include: {
                    Users: {
                        select: {
                            user_id: true,
                            username: true,
                            profile_image: true
                        }
                    },
                    Questions: {
                        select: {
                            question_id: true,
                            title: true
                        }
                    },
                    Answers: {
                        select: {
                            answer_id: true,
                            body: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            res.status(200).json({
                success: true,
                count: reports.length,
                total: totalReports,
                totalPages: Math.ceil(totalReports / limit),
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

            const report = await prisma.reports.findUnique({
                where: { report_id: reportId },
                include: {
                    Users: {
                        select: {
                            user_id: true,
                            username: true,
                            profile_image: true,
                            email: true
                        }
                    },
                    Questions: {
                        select: {
                            question_id: true,
                            title: true,
                            body: true,
                            created_at: true
                        }
                    },
                    Answers: {
                        select: {
                            answer_id: true,
                            body: true,
                            created_at: true
                        }
                    }
                }
            });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }

            res.status(200).json({
                success: true,
                data: report
            });

        } catch (error) {
            console.error(error);
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
            const { userId, reason, questionId, answerId } = req.body;

            if (!userId || !reason) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: userId and reason are required."
                });
            }

            if (!questionId && !answerId) {
                return res.status(400).json({
                    success: false,
                    message: "Either questionId or answerId must be provided."
                });
            }

            const report = await prisma.reports.create({
                data: {
                    user_id: userId,
                    reason,
                    question_id: questionId || null,
                    answer_id: answerId || null,
                    status: 'pending',
                    created_at: new Date()
                },
                include: {
                    Users: {
                        select: {
                            user_id: true,
                            username: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: "Report created successfully",
                data: report
            });

        } catch (error) {
            console.error(error);
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

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: "Status is required"
                });
            }

            const validStatuses = ['pending', 'under-review', 'resolved', 'dismissed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            const report = await prisma.reports.update({
                where: { report_id: reportId },
                data: { status },
                include: {
                    Users: {
                        select: {
                            user_id: true,
                            username: true
                        }
                    }
                }
            });

            res.status(200).json({
                success: true,
                message: "Report status updated successfully",
                data: report
            });

        } catch (error) {
            console.error(error);
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
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
            const skip = (page - 1) * limit;

            const validStatuses = ['pending', 'under-review', 'resolved', 'dismissed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            const totalReports = await prisma.reports.count({
                where: { status }
            });

            const reports = await prisma.reports.findMany({
                where: { status },
                skip,
                take: limit,
                include: {
                    Users: {
                        select: {
                            user_id: true,
                            username: true,
                            profile_image: true
                        }
                    },
                    Questions: {
                        select: {
                            question_id: true,
                            title: true
                        }
                    },
                    Answers: {
                        select: {
                            answer_id: true,
                            body: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            res.status(200).json({
                success: true,
                count: reports.length,
                total: totalReports,
                totalPages: Math.ceil(totalReports / limit),
                currentPage: page,
                status,
                data: reports
            });

        } catch (error) {
            console.error(error);
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

            const report = await prisma.reports.delete({
                where: { report_id: reportId }
            });

            res.status(200).json({
                success: true,
                message: "Report deleted successfully",
                data: report
            });

        } catch (error) {
            console.error(error);
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new ReportController();
