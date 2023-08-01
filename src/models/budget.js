'use strict';
const { Model, Sequelize } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Budget extends Model {
        static associate(models) {
            Budget.belongsTo(models.CampaignGroup, {
                foreignKey: 'campaign_group_id',
                as: 'campaign_group',
            });
        }
    }
    Budget.init(
        {
            campaign_group_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            months: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            percentages: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            net_budgets: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            channels: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            campaign_types: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            campaigns: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            adsets: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Budget',
            tableName: 'budgets',
        }
    );
    return Budget;
};
