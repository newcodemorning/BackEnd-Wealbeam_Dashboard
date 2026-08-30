const Notification = require('../models/notification.model');
const { getIO } = require('../config/socket');

class NotificationService {
    async createNotification(data) {
        const { recipient_role, recipient_id, title, message, type, metadata } = data;

        const notification = await Notification.create({
            recipient_role,
            recipient_id,
            title,
            message,
            type,
            metadata
        });

        // Emit real-time notification via Socket.io
        try {
            const io = getIO();
            
            // Sanitize notification payload before emitting
            const sanitizedPayload = {
                id: notification._id,
                recipient_role: notification.recipient_role,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                metadata: notification.metadata,
                is_read: notification.is_read,
                createdAt: notification.createdAt
            };

            // Emit to specific room based on recipient role
            if (recipient_role === 'super-admin') {
                io.to('room:super-admin').emit('notification:new', sanitizedPayload);
                console.log(`[Notification] Emitted to room:super-admin - ${title}`);
            } else if (recipient_id) {
                // For individual user notifications, emit to their specific room
                io.to(`room:user:${recipient_id}`).emit('notification:new', sanitizedPayload);
                console.log(`[Notification] Emitted to room:user:${recipient_id} - ${title}`);
            }
        } catch (error) {
            console.error('[Notification] Failed to emit socket event:', error.message);
            // Don't throw - notification is already persisted in DB
        }

        return notification;
    }

    async getNotifications(recipientRole, recipientId, options = {}) {
        const { page = 1, limit = 20, is_read } = options;
        
        const query = { recipient_role: recipientRole };
        
        // Only add recipient_id if it's a user-specific notification (not role-based like super-admin)
        // For super-admin, we use role-based notifications without recipient_id
        if (recipientId && recipientRole !== 'super-admin') {
            query.recipient_id = recipientId;
        }
        
        if (is_read !== undefined) {
            query.is_read = is_read === 'true' || is_read === true;
        }

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query)
        ]);

        return {
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        };
    }

    async markAsRead(notificationId) {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { is_read: true },
            { new: true }
        );

        if (!notification) {
            throw new Error('Notification not found');
        }

        return notification;
    }

    async markAllAsRead(recipientRole, recipientId = null) {
        const query = { recipient_role: recipientRole, is_read: false };
        
        // Only add recipient_id if it's a user-specific notification (not role-based like super-admin)
        if (recipientId && recipientRole !== 'super-admin') {
            query.recipient_id = recipientId;
        }

        const result = await Notification.updateMany(query, { is_read: true });

        return {
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        };
    }

    async getUnreadCount(recipientRole, recipientId = null) {
        const query = { recipient_role: recipientRole, is_read: false };
        
        // Only add recipient_id if it's a user-specific notification (not role-based like super-admin)
        if (recipientId && recipientRole !== 'super-admin') {
            query.recipient_id = recipientId;
        }

        const count = await Notification.countDocuments(query);

        return { count };
    }
}

module.exports = new NotificationService();
