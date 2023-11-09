'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });

    // Seed default permissions
    await queryInterface.bulkInsert('permissions', [
      { name: 'system-configuration', createdAt: new Date(), updatedAt: new Date() },
      { name: 'campaign-group-orchestration', createdAt: new Date(), updatedAt: new Date() },
      { name: 'budget-pacing', createdAt: new Date(), updatedAt: new Date() },
      { name: 'reporting', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user-management', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permissions');
  }
};