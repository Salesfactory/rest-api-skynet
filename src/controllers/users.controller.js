const Users = require('../models/users.model');
const response = require('../utils/response');

const getUsers = async (req, res) => {
    try {
        const users = await Users.findAll();
        return response(res, { 
            message: 'Users retrieved successfully', 
            data: users 
        });
    } catch (error) {
        return response(res, { status: 500, message: error.message });
    }
}

module.exports = {
    getUsers,
}