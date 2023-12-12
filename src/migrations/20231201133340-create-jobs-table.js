'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Jobs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            batchId: {
                // New column for batchId
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            data: {
                type: Sequelize.JSONB,
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'pending',
            },
            processedAt: {
                type: Sequelize.DATE,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Jobs');
    },
};
