'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('agencies', {
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
            table_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            advertiser_id_field: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            advertiser_name_field: {
                type: Sequelize.STRING,
                allowNull: false,
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
        await queryInterface.dropTable('agencies');
    },
};
