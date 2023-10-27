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
      { name: 'System Configuration', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Campaign Group Orchestration', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Budget Pacing', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Reporting', createdAt: new Date(), updatedAt: new Date() },
      { name: 'User Management', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permissions');
  }
};