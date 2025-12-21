/**
 * @file NotificationController.js
 * @description Controller responsible for handling Notification CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import {
    createNotification,
    getUserNotifications,
    getNotificationCount,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createBulkNotifications
} from '../utils/notificationService.js';
import { ERRORS } from '../lib/errors.js';

class NotificationController {
    /**
     * Helper to check if user can access notifications
     */
    _canAccessNotifications(requestUserId, targetUserId, userRole) {
        return requestUserId === targetUserId || userRole === 'admin' || userRole === 'moderator';
    }

    /**
     * Get all notifications for the authenticated user
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getNotifications(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const requestUserId = req.user?.user_id;
            const userRole = req.user?.Roles?.role_name;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const isRead = req.query.is_read !== undefined ? req.query.is_read === 'true' : null;

            // Authorization check
            if (!this._canAccessNotifications(requestUserId, userId, userRole)) {
                return res.status(403).json({ success: false, message: ERRORS.FORBIDDEN });
            }

            const skip = (page - 1) * limit;

            const notifications = await getUserNotifications(userId, {
                skip,
                take: limit,
                is_read: isRead
            });

            const total = await getNotificationCount(userId, isRead);
            const unreadCount = await getUnreadCount(userId);

            res.status(200).json({
                success: true,
                count: notifications.length,
                total: total,
                unreadCount,
                totalPages: Math.ceil(total / limit),
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
            const requestUserId = req.user?.user_id;
            const userRole = req.user?.Roles?.role_name;

            // Authorization check
            if (!this._canAccessNotifications(requestUserId, userId, userRole)) {
                return res.status(403).json({ success: false, message: ERRORS.FORBIDDEN });
            }

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
            const requestUserId = req.user?.user_id;

            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    message: "Notification ID is required"
                });
            }

            // Verify ownership in service layer
            const notification = await markAsRead(notificationId, requestUserId);

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
            const requestUserId = req.user?.user_id;
            const userRole = req.user?.Roles?.role_name;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            // Authorization check
            if (!this._canAccessNotifications(requestUserId, userId, userRole)) {
                return res.status(403).json({ success: false, message: ERRORS.FORBIDDEN });
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
            const requestUserId = req.user?.user_id;

            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    message: "Notification ID is required"
                });
            }

            // Verify ownership in service layer
            const notification = await deleteNotification(notificationId, requestUserId);

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
            const requestUserId = req.user?.user_id;
            const userRole = req.user?.Roles?.role_name;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            // Authorization check
            if (!this._canAccessNotifications(requestUserId, userId, userRole)) {
                return res.status(403).json({ success: false, message: ERRORS.FORBIDDEN });
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

    /**
     * Click a notification - returns data and deletes the notification
     * Used for notifications that should navigate somewhere when clicked
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async clickNotification(req, res) {
        try {
            const notificationId = parseInt(req.params.notificationId);
            const requestUserId = req.user?.user_id;

            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    message: "Notification ID is required"
                });
            }

            // Get the notification data before deleting
            const notification = await deleteNotification(notificationId, requestUserId);

            res.status(200).json({
                success: true,
                message: "Notification clicked and deleted",
                data: notification
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new NotificationController();
