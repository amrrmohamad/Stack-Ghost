/**
 * @file NotificationController.js
 * @description Controller responsible for handling Notification CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createBulkNotifications
} from '../utils/notificationService.js';

class NotificationController {
    /**
     * Get all notifications for the authenticated user
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getNotifications(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const isRead = req.query.is_read !== undefined ? req.query.is_read === 'true' : null;

            const skip = (page - 1) * limit;

            const notifications = await getUserNotifications(userId, {
                skip,
                take: limit,
                is_read: isRead
            });

            const total = await getUserNotifications(userId);
            const unreadCount = await getUnreadCount(userId);

            res.status(200).json({
                success: true,
                count: notifications.length,
                total: total.length,
                unreadCount,
                totalPages: Math.ceil(total.length / limit),
                currentPage: page,
                data: notifications
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get unread notification count for a user
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getUnreadCount(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const unreadCount = await getUnreadCount(userId);

            res.status(200).json({
                success: true,
                unreadCount,
                data: { userId, unreadCount }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Create a new notification
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async createNotification(req, res) {
        try {
            const { userId, content } = req.body;

            if (!userId || !content) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: userId and content are required."
                });
            }

            const notification = await createNotification(userId, content);

            res.status(201).json({
                success: true,
                message: "Notification created successfully",
                data: notification
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Mark a notification as read
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async markAsRead(req, res) {
        try {
            const notificationId = parseInt(req.params.notificationId);

            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    message: "Notification ID is required"
                });
            }

            const notification = await markAsRead(notificationId);

            res.status(200).json({
                success: true,
                message: "Notification marked as read",
                data: notification
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async markAllAsRead(req, res) {
        try {
            const userId = parseInt(req.params.userId);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            const result = await markAllAsRead(userId);

            res.status(200).json({
                success: true,
                message: "All notifications marked as read",
                data: { updated: result.count }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Delete a notification
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async deleteNotification(req, res) {
        try {
            const notificationId = parseInt(req.params.notificationId);

            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    message: "Notification ID is required"
                });
            }

            const notification = await deleteNotification(notificationId);

            res.status(200).json({
                success: true,
                message: "Notification deleted successfully",
                data: notification
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Delete all notifications for a user
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async deleteAllNotifications(req, res) {
        try {
            const userId = parseInt(req.params.userId);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            const result = await deleteAllNotifications(userId);

            res.status(200).json({
                success: true,
                message: "All notifications deleted successfully",
                data: { deleted: result.count }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Create bulk notifications for multiple users
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async createBulkNotifications(req, res) {
        try {
            const { userIds, content } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0 || !content) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: userIds (array) and content are required."
                });
            }

            const count = await createBulkNotifications(userIds, content);

            res.status(201).json({
                success: true,
                message: "Bulk notifications created successfully",
                data: { notificationsCreated: count }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new NotificationController();
