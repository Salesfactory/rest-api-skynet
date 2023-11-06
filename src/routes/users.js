const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { hasPermissions } = require('./middlewares');

// users routes
router.get('/', [hasPermissions('user-management')], userController.getUsers);
// this endpoint is being used by every user to get his own data
router.get(
    '/:id',
    userController.getUserById
);
router.post('/', userController.createUser);
router.put(
    '/:id',
    [hasPermissions('user-management')],
    userController.updateUser
);
router.delete(
    '/:id',
    [hasPermissions('user-management')],
    userController.deleteUser
);
router.get(
    '/:id/permissions',
    [hasPermissions('user-management')],
    userController.getUserPermissions
);

module.exports = router;
