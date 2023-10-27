'use strict';

const {
  Model
} = require('sequelize');

// user model
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: 'roleId',
        as: 'role',
      });
    }
  }
  User.init({
    uid: {
      type: DataTypes.UUID,
    },
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    avatar: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    contact: {
      type: DataTypes.TEXT,
    },
    active: {
      type: DataTypes.BOOLEAN,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  });
  return User;
};
