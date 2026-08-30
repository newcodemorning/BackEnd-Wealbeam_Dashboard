const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');

const router = express.Router();

// All notification routes require authentication
router.use(authenticateUser);

// Super Admin only routes
router.use(authorizeRole(['super-admin']));

// GET /api/v1/admin/notifications - Fetch paginated notifications
router.get('/', notificationController.getNotifications);

// PATCH /api/v1/admin/notifications/:id/read - Mark specific notification as read
router.patch('/:id/read', notificationController.markAsRead);

// PATCH /api/v1/admin/notifications/mark-all-read - Mark all unread notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// GET /api/v1/admin/notifications/unread-count - Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

module.exports = router;
