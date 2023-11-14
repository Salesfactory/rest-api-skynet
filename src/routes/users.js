const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { hasOneOfRoles } = require('./middlewares');

// users routes
router.get('/', [hasOneOfRoles(['Super', 'Admin'])], userController.getUsers);
// this endpoint is being used by every user to get his own data
router.get('/:id', userController.getUserById);
// this endpoint is beign used by the user once successfully registered
router.post('/', userController.createUser);
// this endpoint is being used by the user to update his own data
router.put('/:id', userController.updateUser);

// user won't be able to delete his own account
router.delete(
    '/:id',
    [hasOneOfRoles(['Super', 'Admin'])],
    userController.deleteUser
);
router.get('/:id/permissions', userController.getUserPermissions);

module.exports = router;
