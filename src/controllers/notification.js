const { Notification } = require('../models');
const { getUser } = require('../utils');

const getNotifications = async (req, res) => {
    const user = await getUser(res);
    try {
        const notifications = await Notification.findAll({
            where: { user_id: user.id, roleId: user.roleId },
            order: [['createdAt', 'DESC']],
            attributes: [
                'id',
                'title',
                'message',
                'campaign_group_info',
                'client_info',
                'type',
                'status',
                ['createdAt', 'timestamp'],
            ],
        });

        return res.status(200).json({
            data: notifications,
            message: `Notifications retrieved successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getNotificationsByStatus = async (req, res) => {
    const user = await getUser(res);

    if (!['unread', 'read'].includes(req.params.status)) {
        return res.status(400).json({
            message: `Invalid notification status: ${req.params.status}`,
        });
    }

    try {
        const notifications = await Notification.findAll({
            where: { user_id: user.id, status: req.params.status },
            order: [['createdAt', 'DESC']],
            attributes: [
                'id',
                'title',
                'message',
                'campaign_group_info',
                'client_info',
                'type',
                'status',
                ['createdAt', 'timestamp'],
            ],
        });

        return res.status(200).json({
            data: notifications,
            message: `Notifications retrieved successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createNotification = async (req, res) => {
    const { title, message, campaign_group_info, client_info, status } =
        req.body;
    try {
        const requiredFields = [
            'title',
            'message',
            'campaign_group_info',
            'client_info',
            'status',
        ];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }
        const user = await getUser(res);

        const notification = await Notification.create({
            user_id: user.id,
            title,
            message,
            campaign_group_info,
            client_info,
            status,
        });

        return res.status(201).json({
            data: notification,
            message: `Notification created successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateNotification = async (req, res) => {
    const id = req.params.id;
    const { title, message, campaign_group_info, client_info, type, status } =
        req.body;
    try {
        const notification = await Notification.findOne({
            where: { id: parseInt(id) },
        });
        if (!notification)
            return res.status(404).json({
                message: `Notification not found`,
            });
        await Notification.update(
            {
                title,
                message,
                campaign_group_info,
                client_info,
                type,
                status,
            },
            { where: { id: parseInt(id) } }
        );
        return res.status(200).json({
            data: await Notification.findOne({
                where: { id: parseInt(id) },
            }),
            message: `Notification with id ${id} updated successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const markAsRead = async (req, res) => {
    const id = req.params.id;

    try {
        const notification = await Notification.findOne({
            where: { id: parseInt(id), status: 'unread' },
        });
        if (!notification)
            return res.status(404).json({
                message: `Notification not found or already marked as read`,
            });
        await Notification.update(
            { status: 'read' },
            { where: { id: parseInt(id) } }
        );
        return res.status(200).json({
            data: await Notification.findOne({
                where: { id: parseInt(id) },
            }),
            message: `Notification with id ${id} was marked as read`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotifications,
    createNotification,
    updateNotification,
    getNotificationsByStatus,
    markAsRead,
};
