/**
 * @file notificationRoutes.js
 * @description Routes responsible for handling Notification CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-16
 */

import express from 'express';
import NotificationController from '../controllers/NotificationController.js';

const router = express.Router();

// Get all notifications for a user
router.get('/user/:userId', NotificationController.getNotifications);

// Get unread notification count for a user
router.get('/user/:userId/unread-count', NotificationController.getUnreadCount);

// Create a new notification
router.post('/', NotificationController.createNotification);

// Create bulk notifications
router.post('/bulk', NotificationController.createBulkNotifications);

// Mark a notification as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// Mark all notifications as read for a user
router.put('/user/:userId/mark-all-read', NotificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', NotificationController.deleteNotification);

// Delete all notifications for a user
router.delete('/user/:userId', NotificationController.deleteAllNotifications);

export default router;
