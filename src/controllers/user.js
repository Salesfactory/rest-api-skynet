const { User, Role, Permission } = require('../models');
const { validateUUID } = require('../utils');
const { Op } = require('sequelize');

const getUserPermissions = async (req, res) => {
    const id = req.params.id;
    const isUUID = validateUUID(id);
    const searchParams = {
        ...(isUUID ? { uid: id } : { id: parseInt(id) }),
    };

    try {
        const user = await User.findOne({
            where: searchParams,
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name'],
                    as: 'role',
                    include: [
                        {
                            model: Permission,
                            attributes: ['id', 'name'],
                            as: 'permissions',
                            through: { attributes: [] },
                        },
                    ],
                },
            ],
        });
        if (!user)
            return res.status(404).json({
                message: `User not found`,
            });
        return res.status(200).json({
            data: user.role.permissions,
            message: `User permissions retrieved successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getUsers = async (req, res) => {
    const { search, active } = req.query;
    let searchParams = { active: active ? active : true };
    try {
        if (search) {
            searchParams = {
                ...searchParams,
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { uid: { [Op.like]: `%${search}%` } },
                    { contact: { [Op.like]: `%${search}%` } },
                ],
            };
        }
        const users = await User.findAll({ where: searchParams });
        return res.status(200).json({
            message: 'Users retrieved successfully',
            data: users,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    const { active } = req.query;
    const id = req.params.id;
    const isUUID = validateUUID(id);

    const searchParams = {
        ...(isUUID ? { uid: id } : { id: parseInt(id) }),
        active: active ? active : true,
    };

    try {
        const user = await User.findOne({ where: searchParams });
        if (!user)
            return res.status(404).json({
                message: `User not found`,
            });
        return res.status(200).json({
            data: user,
            message: `User with id ${id} retrieved successfully`,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createUser = async (req, res) => {
    const { name, email, uid, avatar, description, contact, active } = req.body;
    const requiredParams = ['uid', 'email'];
    const uniqueFields = ['email', 'uid'];

    try {
        const missingParams = requiredParams.filter(param => !req.body[param]);
        if (missingParams.length > 0) {
            return res.status(400).json({
                message: `Missing required params: ${missingParams.join(', ')}`,
            });
        }

        const user = await User.create({
            name,
            email,
            uid,
            avatar,
            description,
            contact,
            active,
        });
        return res.status(201).json({
            data: user,
            message: 'User created successfully',
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            if (error.fields && Object.keys(error.fields).length > 0) {
                const field = Object.keys(error.fields)[0];
                if (uniqueFields.includes(field)) {
                    return res.status(400).json({
                        message: `${field} already exists`,
                    });
                }
            }
        }
        return res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    const id = req.params.id;
    const isUUID = validateUUID(id);
    const searchParams = {
        ...(isUUID ? { uid: id } : { id: parseInt(id) }),
    };
    const { name, email, avatar, description, contact, active } = req.body;
    const uniqueFields = ['email', 'uid'];

    try {
        const user = await User.findOne({ where: searchParams });
        if (!user)
            return res.status(404).json({
                message: `User not found`,
            });

        const userData = await User.update(
            {
                name,
                email,
                avatar,
                description,
                contact,
                active,
            },
            { where: searchParams }
        );

        return res.status(201).json({
            data: userData,
            message: `User updated successfully`,
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            if (error.fields && Object.keys(error.fields).length > 0) {
                const field = Object.keys(error.fields)[0];
                if (uniqueFields.includes(field)) {
                    return res.status(400).json({
                        message: `${field} already exists`,
                    });
                }
            }
        }
        return res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    const id = req.params.id;
    const isUUID = validateUUID(id);
    const searchParams = {
        ...(isUUID ? { uid: id } : { id: parseInt(id) }),
    };

    try {
        const user = await User.findOne({ where: searchParams });
        if (!user)
            return res.status(404).json({
                message: `User not found`,
            });
        await User.destroy({ where: searchParams });
        return res.status(200).json({
            message: `User deleted successfully`,
            data: user,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUserPermissions,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
