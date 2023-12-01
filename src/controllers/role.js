const { Role, User, Permission, RolePermission, sequelize } = require('../models');
// const sequelize = require('sequelize');

const getRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    model: Permission,
                    attributes: ['id', 'name'],
                    as: 'permissions',
                    through: { attributes: [] },
                },
            ],
            order: [['id', 'ASC']],
        });
        return res.status(200).json({
            message: 'Roles retrieved successfully',
            data: roles,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getRole = async (req, res) => {
    const id = req.params.id;
    try {
        const role = await Role.findOne({
            where: { id },
            include: [
                {
                    model: Permission,
                    attributes: ['id', 'name'],
                    as: 'permissions',
                    through: { attributes: [] },
                },
            ],
            attributes: ['id', 'name'],
        });
        if (!role)
            return res.status(404).json({
                message: `Role not found`,
            });
        return res.status(200).json({
            data: role,
            message: `Role with id ${id} retrieved successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createRole = async (req, res) => {
    const { name } = req.body;
    try {
        const role = await Role.create({ name });
        return res.status(201).json({
            message: 'Role created successfully',
            data: role,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateRole = async (req, res) => {
    const id = req.params.id;
    const { name } = req.body;
    try {
        const role = await Role.findOne({ where: { id } });
        if (!role)
            return res.status(404).json({
                message: `Role not found`,
            });
        await role.update({ name });
        return res.status(200).json({
            message: `Role with id ${id} updated successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateRolePermissions = async (req, res) => {
    const roleId = req.params.id;
    const { permissionIds } = req.body;

    try {
        // Verificar si el rol existe
        const role = await Role.findOne({ where: { id: roleId } });
        // console.log(role);
        if (!role)
            return res.status(404).json({
                message: `Role not found`,
            });

        // Obtener los permisos actuales del rol
        const currentPermissions = await sequelize.query(
            `SELECT * FROM rolePermissions WHERE roleId = ${roleId}`
        );
        console.log(currentPermissions);

        // Convertir los permisos actuales a un array de IDs
        const currentPermissionIds = currentPermissions.map(
            permission => permission.permissionId
        );

        // Calcular los permisos que se deben agregar y eliminar
        const permissionsToAdd = permissionIds.filter(
            id => !currentPermissionIds.includes(id)
        );
        const permissionsToRemove = currentPermissionIds.filter(
            id => !permissionIds.includes(id)
        );

        // Eliminar permisos no seleccionados
        await RolePermission.destroy({
            where: {
                roleId: roleId,
                permissionId: permissionsToRemove,
            },
        });

        // Agregar nuevos permisos
        const newRolePermissions = permissionsToAdd.map(permissionId => {
            return { roleId: roleId, permissionId: permissionId };
        });
        await RolePermission.bulkCreate(newRolePermissions);

        return res.status(200).json({
            message: `Role with id ${roleId} updated successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteRole = async (req, res) => {
    const id = req.params.id;
    try {
        const role = await Role.findOne({ where: { id } });
        if (!role)
            return res.status(404).json({
                message: `Role not found`,
            });
        await role.destroy();
        return res.status(200).json({
            message: `Role with id ${id} deleted successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name'],
                    as: 'roles',
                    through: { attributes: [] },
                },
            ],
        });
        return res.status(200).json({
            message: 'Permissions retrieved successfully',
            data: permissions,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getPermission = async (req, res) => {
    const id = req.params.id;
    try {
        const permission = await Permission.findOne({
            where: { id },
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name'],
                    as: 'roles',
                    through: { attributes: [] },
                },
            ],
            attributes: ['id', 'name'],
        });
        if (!permission)
            return res.status(404).json({
                message: `Permission not found`,
            });
        return res.status(200).json({
            data: permission,
            message: `Permission with id ${id} retrieved successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const assignRole = async (req, res) => {
    const { roleId, userId } = req.params;
    try {
        const roleInstance = await Role.findOne({ where: { id: roleId } });
        if (!roleInstance)
            return res.status(404).json({
                message: `Role not found`,
            });

        const userInstance = await User.findOne({ where: { id: userId } });

        if (!userInstance)
            return res.status(404).json({
                message: `User not found`,
            });

        userInstance.roleId = roleInstance.id;
        await userInstance.save();

        return res.status(200).json({
            message: `Role with id ${roleId} assigned to user with id ${userId} successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRoles,
    getRole,
    createRole,
    updateRole,
    updateRolePermissions,
    deleteRole,
    getPermissions,
    getPermission,
    assignRole,
};
