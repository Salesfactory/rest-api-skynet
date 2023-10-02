'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('campaign_groups', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            client_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            company_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            goals: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            total_gross_budget: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            margin: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            flight_time_start: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            flight_time_end: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            channels: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            net_budget: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            comments: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            change_reason_log: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'N/S',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
            deletedAt: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('campaign_groups');
    },
};
