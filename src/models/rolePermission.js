'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RolePermission extends Model {
        static associate(models) {
            // Define la relación muchos a muchos con la tabla Role
            this.belongsTo(models.Role, {
                foreignKey: 'roleId',
                onDelete: 'CASCADE',
            });

            // Define la relación muchos a muchos con la tabla Permission
            this.belongsTo(models.Permission, {
                foreignKey: 'permissionId',
                onDelete: 'CASCADE',
            });
        }
    }
    RolePermission.init(
        {
            roleId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            permissionId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'RolePermission',
            tableName: 'rolePermissions',
        }
    );
    return RolePermission;
};
