'use strict';
const { Model, Sequelize } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Permission extends Model {
        static associate(models) {
            Permission.belongsToMany(models.Role, {
                through: 'rolePermissions',
                foreignKey: 'permissionId',
                otherKey: 'roleId',
            });
        }
    }
    Permission.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
        },
        {
            sequelize,
            modelName: 'Permission',
            tableName: 'permissions',
        }
    );
    return Permission;
};
