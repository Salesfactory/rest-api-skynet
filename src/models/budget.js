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
            periods: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            allocations: {
                type: DataTypes.JSON,
                allowNull: false,
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
