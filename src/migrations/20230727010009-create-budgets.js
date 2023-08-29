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
            periods: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            allocations: {
                type: Sequelize.JSON,
                allowNull: false,
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
