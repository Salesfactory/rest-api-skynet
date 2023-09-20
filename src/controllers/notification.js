const { Notification } = require('../models');
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll();

        return res.status(200).json({
            data: notifications.sort((a, b) => {
                return b.createdAt - a.createdAt;
            }),
            message: `Notifications retrieved successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createNotification = async (req, res) => {
    const {
        title,
        message,
        campaign_group_info,
        client_info,
        timestamp,
        type,
        status,
    } = req.body;
    try {
        const notification = await Notification.create({
            title,
            message,
            campaign_group_info,
            client_info,
            timestamp,
            type,
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
    const {
        title,
        message,
        campaign_group_info,
        client_info,
        timestamp,
        type,
        status,
    } = req.body;
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
                timestamp,
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

module.exports = {
    getNotifications,
    createNotification,
    updateNotification,
};
