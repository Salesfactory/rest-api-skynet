'use strict';

const { Model } = require('sequelize');

// CampaignGroup model
module.exports = (sequelize, DataTypes) => {
    class CampaignGroup extends Model {
        static associate(models) {
            CampaignGroup.belongsTo(models.Client, {
                foreignKey: 'client_id',
                as: 'client',
            });
            CampaignGroup.hasMany(models.Budget, {
                foreignKey: 'campaign_group_id',
                as: 'budgets',
            });
            CampaignGroup.hasMany(models.Campaign, {
                foreignKey: 'campaign_group_id',
                as: 'campaigns',
            });
        }
    }
    CampaignGroup.init(
        {
            client_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            company_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            goals: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            total_gross_budget: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            margin: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            flight_time_start: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            flight_time_end: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            channels: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            net_budget: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            comments: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'CampaignGroup',
            tableName: 'campaign_groups',
        }
    );
    return CampaignGroup;
};