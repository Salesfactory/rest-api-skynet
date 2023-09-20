'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Notification extends Model {
        static associate(models) {}
    }
    Notification.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            message: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            campaign_group_info: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            client_info: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE,
            },
        },
        {
            sequelize,
            modelName: 'Notification',
            tableName: 'notifications',
        }
    );
    return Notification;
};
