'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('campaigns', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
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
            net_budget: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            channels: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            comments: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            // this will contain the entire table of budgets
            budget: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            campaign_types: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            // for each channel and its channel types, there are campaigns and adsets
            campaigns: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            adsets: {
                type: Sequelize.JSON,
                allowNull: true,
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
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('campaigns');
    },
};
