/**
 * @file notificationRoutes.js
 * @description Routes responsible for handling Notification CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */

import express from 'express';
import NotificationController from '../controllers/NotificationController.js';
import auth from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(auth);

// Get all notifications for a user (owner or admin)
router.get('/user/:userId', NotificationController.getNotifications);

// Get unread notification count for a user (owner or admin)
router.get('/user/:userId/unread-count', NotificationController.getUnreadCount);

// Create a new notification (admin only - for system notifications)
router.post('/', authorizeRoles('admin', 'moderator'), NotificationController.createNotification);

// Create bulk notifications (admin only)
router.post('/bulk', authorizeRoles('admin', 'moderator'), NotificationController.createBulkNotifications);

// Mark a notification as read (owner only)
router.put('/:notificationId/read', NotificationController.markAsRead);

// Mark all notifications as read for a user (owner or admin)
router.put('/user/:userId/mark-all-read', NotificationController.markAllAsRead);

// Delete a notification (owner only)
router.delete('/:notificationId', NotificationController.deleteNotification);

// Delete all notifications for a user (owner or admin)
router.delete('/user/:userId', NotificationController.deleteAllNotifications);

export default router;
