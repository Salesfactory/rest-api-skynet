'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class DeprecatedCampaignType extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            DeprecatedCampaignType.belongsTo(models.Agency, {
                foreignKey: 'channel_id',
                as: 'channel',
            });
        }
    }
    DeprecatedCampaignType.init(
        {
            channel_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'DeprecatedCampaignType',
            tableName: 'deprecated_campaign_types',
        }
    );
    return DeprecatedCampaignType;
};
