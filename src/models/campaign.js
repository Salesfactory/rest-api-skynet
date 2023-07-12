'use strict';

const { Model } = require('sequelize');

// Campaign model
module.exports = (sequelize, DataTypes) => {
    class Campaign extends Model {
        static associate(models) {
            Campaign.belongsTo(models.Client, {
                foreignKey: 'client_id',
                as: 'client',
            });
        }
    }
    Campaign.init(
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
            net_budget: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            channels: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            comments: {
                type: DataTypes.TEXT,
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
