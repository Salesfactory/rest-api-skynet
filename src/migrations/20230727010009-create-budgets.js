'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('budgets', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            campaign_group_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'campaign_groups',
                    key: 'id',
                },
                onDelete: 'cascade',
                onUpdate: 'cascade',
            },
            months: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            percentages: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            net_budgets: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            channels: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            campaign_types: {
                type: Sequelize.JSON,
                allowNull: true,
            },
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
        await queryInterface.dropTable('budgets');
    },
};
