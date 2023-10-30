const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { hasPermissions } = require('./middlewares');

// users routes
router.get('/', [hasPermissions('user-management')], userController.getUsers);
router.get(
    '/:id',
    [hasPermissions('user-management')],
    userController.getUserById
);
router.post(
    '/',
    [hasPermissions('user-management')],
    userController.createUser
);
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
