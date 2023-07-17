'use strict';

const {
  Model
} = require('sequelize');

// user model
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
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
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  });
  return User;
};
