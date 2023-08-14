'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Agency extends Model {
        static associate(models) {
            Agency.hasMany(models.Client, {
                foreignKey: 'agency_id',
                as: 'clients',
            });
        }
    }
    Agency.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            aliases: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            table_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            advertiser_id_field: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            advertiser_name_field: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Agency',
            tableName: 'agencies',
        }
    );
    return Agency;
};
