'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rolePermissions', {
      roleId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permissionId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
    await queryInterface.bulkInsert('rolePermissions', [
      { roleId: 1, permissionId: 1, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 2, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 2, permissionId: 1, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 2, permissionId: 2, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rolePermissions');
  }
};