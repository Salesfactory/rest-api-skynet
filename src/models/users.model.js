const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING
  }
}, {
    tableName: 'users',
    timestamps: false,
    createdAt: false,
    updatedAt: false,
});

module.exports = User;