/**
 * @file notificationService.js
 * @description Service for managing notifications in the system
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import prisma from '../lib/prisma.js';

/**
 * Create a new notification
 * @param {number} userId - The user ID to receive the notification
 * @param {string} content - The notification content/message
 * @returns {Promise<Object>} The created notification
 */
export const createNotification = async (userId, content) => {
    try {
        const notification = await prisma.notifications.create({
            data: {
                user_id: userId,
                content,
                is_read: false,
                created_at: new Date()
            }
        });
        console.log(`Notification created for user ${userId}: ${content}`);
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

/**
 * Get all notifications for a user
 * @param {number} userId - The user ID
 * @param {Object} options - Query options (skip, take, is_read)
 * @returns {Promise<Array>} Array of notifications
 */
export const getUserNotifications = async (userId, options = {}) => {
    try {
        const { skip = 0, take = 50, is_read = null } = options;

        const where = { user_id: userId };
        if (is_read !== null) {
            where.is_read = is_read;
        }

        const notifications = await prisma.notifications.findMany({
            where,
            skip,
            take,
            orderBy: {
                created_at: 'desc'
            }
        });

        return notifications;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    }
};

/**
 * Get total notification count for a user
 * @param {number} userId - The user ID
 * @param {boolean|null} isRead - Filter by read status (null for all)
 * @returns {Promise<number>} Total count of notifications
 */
export const getNotificationCount = async (userId, isRead = null) => {
    try {
        const where = { user_id: userId };
        if (isRead !== null) {
            where.is_read = isRead;
        }

        const count = await prisma.notifications.count({ where });
        return count;
    } catch (error) {
        console.error("Error counting notifications:", error);
        throw error;
    }
};

/**
 * Get unread notification count for a user
 * @param {number} userId - The user ID
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
    try {
        const count = await prisma.notifications.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });
        return count;
    } catch (error) {
        console.error("Error fetching unread count:", error);
        throw error;
    }
};

/**
 * Mark a notification as read
 * @param {number} notificationId - The notification ID
 * @param {number} requestUserId - The user making the request (for ownership check)
 * @returns {Promise<Object>} The updated notification
 */
export const markAsRead = async (notificationId, requestUserId) => {
    try {
        // First check ownership
        const notification = await prisma.notifications.findUnique({
            where: { notification_id: notificationId }
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.user_id !== requestUserId) {
            throw new Error('You can only mark your own notifications as read');
        }

        const updated = await prisma.notifications.update({
            where: { notification_id: notificationId },
            data: { is_read: true }
        });
        return updated;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} Update result
 */
export const markAllAsRead = async (userId) => {
    try {
        const result = await prisma.notifications.updateMany({
            where: {
                user_id: userId,
                is_read: false
            },
            data: { is_read: true }
        });
        return result;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        throw error;
    }
};

/**
 * Delete a notification
 * @param {number} notificationId - The notification ID
 * @param {number} requestUserId - The user making the request (for ownership check)
 * @returns {Promise<Object>} The deleted notification
 */
export const deleteNotification = async (notificationId, requestUserId) => {
    try {
        // First check ownership
        const notification = await prisma.notifications.findUnique({
            where: { notification_id: notificationId }
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.user_id !== requestUserId) {
            throw new Error('You can only delete your own notifications');
        }

        const deleted = await prisma.notifications.delete({
            where: { notification_id: notificationId }
        });
        return deleted;
    } catch (error) {
        console.error("Error deleting notification:", error);
        throw error;
    }
};

/**
 * Delete all notifications for a user
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteAllNotifications = async (userId) => {
    try {
        const result = await prisma.notifications.deleteMany({
            where: { user_id: userId }
        });
        return result;
    } catch (error) {
        console.error("Error deleting all notifications:", error);
        throw error;
    }
};

/**
 * Create bulk notifications for multiple users
 * @param {Array<number>} userIds - Array of user IDs
 * @param {string} content - The notification content/message
 * @returns {Promise<number>} Number of notifications created
 */
export const createBulkNotifications = async (userIds, content) => {
    try {
        const result = await prisma.notifications.createMany({
            data: userIds.map(userId => ({
                user_id: userId,
                content,
                is_read: false,
                created_at: new Date()
            }))
        });
        console.log(`${result.count} notifications created for users`);
        return result.count;
    } catch (error) {
        console.error("Error creating bulk notifications:", error);
        throw error;
    }
};
