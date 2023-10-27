'use strict';
const { Model, Sequelize } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Role extends Model {
        static associate(models) {
            Role.belongsToMany(models.Permission, {
                through: 'rolePermissions',
                foreignKey: 'roleId',
                otherKey: 'permissionId',
                as: 'permissions',
            });
        }
    }
    Role.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
        },
        {
            sequelize,
            modelName: 'Role',
            tableName: 'roles',
        }
    );
    return Role;
};
