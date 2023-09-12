'use strict';
const { Model, Sequelize } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Pacing extends Model {
        static associate(models) {
            Pacing.belongsTo(models.CampaignGroup, {
                foreignKey: 'campaign_group_id',
                as: 'campaign_group',
            });
        }
    }
    Pacing.init(
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
            modelName: 'Pacing',
            tableName: 'pacings',
        }
    );
    return Pacing;
};
