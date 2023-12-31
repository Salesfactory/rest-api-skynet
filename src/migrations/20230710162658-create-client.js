'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('clients', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            name: {
                type: Sequelize.STRING,
				allowNull: false,
            },
            aliases: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            sub_advertiser_aliases: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            advertiser_ids: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            sub_advertiser_ids: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            agency_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('clients');
    },
};
