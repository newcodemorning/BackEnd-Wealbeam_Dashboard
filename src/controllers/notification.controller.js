const notificationService = require('../services/notification.service');

exports.getNotifications = async (req, res) => {
    try {
        const { page, limit, is_read } = req.query;
        const recipientRole = req.user.role;
        const recipientId = req.user.roleId;

        const result = await notificationService.getNotifications(recipientRole, recipientId, {
            page,
            limit,
            is_read
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await notificationService.markAsRead(id);

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(error.message === 'Notification not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const recipientRole = req.user.role;
        const recipientId = req.user.roleId;

        const result = await notificationService.markAllAsRead(recipientRole, recipientId);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const recipientRole = req.user.role;
        const recipientId = req.user.roleId;

        const result = await notificationService.getUnreadCount(recipientRole, recipientId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
