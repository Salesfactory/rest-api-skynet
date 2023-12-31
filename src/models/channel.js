'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Channel extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Channel.hasMany(models.DeprecatedCampaignType, {
                foreignKey: 'channel_id',
                as: 'deprecatedCampaignTypes',
            });
        }
    }
    Channel.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isApiEnabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            sequelize,
            modelName: 'Channel',
            tableName: 'channels',
        }
    );
    return Channel;
};
