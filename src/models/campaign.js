'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Campaign extends Model {
        static associate(models) {
            Campaign.belongsTo(models.CampaignGroup, {
                foreignKey: 'campaign_group_id',
                as: 'campaign_group',
            });
        }
    }
    Campaign.init(
        {
            campaign_group_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            id_campaign: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            goal: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            channel: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            campaign_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            adset: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            paused: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            pause_reason: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            delete_reason: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Campaign',
            tableName: 'campaigns',
        }
    );
    return Campaign;
};
