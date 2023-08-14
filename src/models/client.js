'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Client extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Client.belongsTo(models.Agency, {
                foreignKey: 'agency_id',
                as: 'agency',
            });
        }
    }
    Client.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            aliases: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            sub_advertiser_aliases: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            advertiser_ids: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            sub_advertiser_ids: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            agency_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            sequelize,
            modelName: 'Client',
            tableName: 'clients',
        }
    );
    return Client;
};
