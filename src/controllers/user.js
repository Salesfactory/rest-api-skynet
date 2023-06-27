const { User } = require('../models');
const response = require('../utils/response');
const { Op } = require('sequelize');

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
                    { username: { [Op.like]: `%${search}%` } },
                    { contact: { [Op.like]: `%${search}%`} }
                ]
            };
        }
        const users = await User.findAll({ where: searchParams });
        return response(res, { 
            message: 'Users retrieved successfully', 
            data: users 
        });
    } catch (error) {
        return response(res, { status: 500, message: error.message });
    }
}

const getUserById = async (req, res) => {
    const { active } = req.query;
    const id = parseInt(req.params.id);
    const searchParams = { id, active: active ? active : true };

    try {
        const user = await User.findOne({ where: searchParams });
        if (!user)
            return response(res, { 
                status: 404, 
                message: `User not found` 
            });
        return response(res, { 
            data: user, 
            message: `User with id ${id} retrieved successfully` 
        });
    } catch (error) {
        return response(res, { status: 500, message: error.message });
    }
}

const createUser = async (req, res) => {
    const { 
        name, 
        email, 
        username, 
        avatar, 
        description, 
        contact, 
        active 
    } = req.body;
    const requiredParams = ["name", "email", "username"];
    const uniqueFields = ["email", "username"];

    try {
        const missingParams = requiredParams.filter(param => !req.body[param]);
        if (missingParams.length > 0) {
            return response(res, { 
                status: 400, 
                message: `Missing required params: ${missingParams.join(", ")}` 
            });
        }

        const user = await User.create({ 
            name, 
            email, 
            username, 
            avatar, 
            description, 
            contact, 
            active 
        });
        return response(res, {
            status: 201,
            data: user, 
            message: 'User created successfully' 
        });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            if (error.fields && Object.keys(error.fields).length > 0) {
                const field = Object.keys(error.fields)[0];
                if (uniqueFields.includes(field)) {
                    return response(res, { 
                        status: 400, 
                        message: `${field} already exists` 
                    });
                }
            }
        }
        return response(res, { status: 500, message: error.message });
    }
}

const updateUser = async (req, res) => {
    const id = parseInt(req.params.id);
    const { 
        name, 
        email, 
        username, 
        avatar,
        description,
        contact,
        active 
    } = req.body;
    const uniqueFields = ["email", "username"];

    try {
        const user = await User.findOne({ where: { id } });
        if (!user)
            return response(res, { 
                status: 404, 
                message: `User not found` 
            });

        const userData = await User.update({
            name,
            email,
            username,
            avatar,
            description,
            contact,
            active
        }, { where: { id } });

        return response(res, {
            status: 201,
            data: userData, 
            message: `User with id ${id} updated successfully` 
        });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            if (error.fields && Object.keys(error.fields).length > 0) {
                const field = Object.keys(error.fields)[0];
                if (uniqueFields.includes(field)) {
                    return response(res, { 
                        status: 400, 
                        message: `${field} already exists` 
                    });
                }
            }
        }
        return response(res, { status: 500, message: error.message });
    }
}

const deleteUser = async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const user = await User.findOne({ where: { id } });
        if (!user)
            return response(res, { 
                status: 404, 
                message: `User not found` 
            });
        await User.destroy({ where: { id } });
        return response(res, { 
            message: `User deleted successfully`,
            data: user
        });
    } catch (error) {
        return response(res, { status: 500, message: error.message });
    }
}

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
}