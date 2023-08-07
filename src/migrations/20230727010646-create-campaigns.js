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
            // bigquery campaign id, naming convention is inverted
            id_campaign: {
                type: Sequelize.BIGINT,
                allowNull: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            goal: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            channel: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            campaign_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            // insert here the adsets from bigquery or create a new table.
            adset: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            paused: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            pause_reason: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            delete_reason: {
                type: Sequelize.STRING,
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
            deletedAt: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('campaigns');
    },
};
