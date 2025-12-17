/**
 * @file reportService.js
 * @description Service layer for Report operations
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new report
 */
export const createReport = async (userId, reason, questionId = null, answerId = null) => {
    if (!userId || !reason) {
        throw new Error('Missing required fields: userId and reason are required');
    }

    if (!questionId && !answerId) {
        throw new Error('Either questionId or answerId must be provided');
    }

    try {
        const report = await prisma.reports.create({
            data: {
                user_id: parseInt(userId),
                reason,
                question_id: questionId ? parseInt(questionId) : null,
                answer_id: answerId ? parseInt(answerId) : null,
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

        return report;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all reports with pagination and filtering
 */
export const getAllReports = async (page = 1, limit = 20, status = null) => {
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

    return { reports, totalReports, totalPages: Math.ceil(totalReports / limit) };
};

/**
 * Get report by ID
 */
export const getReportById = async (reportId) => {
    const report = await prisma.reports.findUnique({
        where: { report_id: parseInt(reportId) },
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
        throw new Error('Report not found');
    }

    return report;
};

/**
 * Update report status
 */
export const updateReportStatus = async (reportId, status) => {
    if (!status) {
        throw new Error('Status is required');
    }

    const validStatuses = ['pending', 'under-review', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
        const report = await prisma.reports.update({
            where: { report_id: parseInt(reportId) },
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

        return report;
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Report not found');
        }
        throw error;
    }
};

/**
 * Get reports by status
 */
export const getReportsByStatus = async (status, page = 1, limit = 20) => {
    const validStatuses = ['pending', 'under-review', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const skip = (page - 1) * limit;

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

    return { reports, totalReports, totalPages: Math.ceil(totalReports / limit) };
};

/**
 * Delete a report
 */
export const deleteReport = async (reportId) => {
    try {
        const report = await prisma.reports.delete({
            where: { report_id: parseInt(reportId) }
        });

        return report;
    } catch (error) {
        if (error.code === 'P2025') {
            throw new Error('Report not found');
        }
        throw error;
    }
};

/**
 * Get report statistics
 */
export const getReportStats = async () => {
    const totalReports = await prisma.reports.count();

    const statusCounts = await prisma.reports.groupBy({
        by: ['status'],
        _count: true
    });

    const stats = {
        totalReports,
        byStatus: {}
    };

    statusCounts.forEach(item => {
        stats.byStatus[item.status] = item._count;
    });

    return stats;
};

/**
 * Get recent reports
 */
export const getRecentReports = async (limit = 10) => {
    const reports = await prisma.reports.findMany({
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

    return reports;
};
