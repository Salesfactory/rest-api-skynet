const express = require('express');
const router = express.Router();
const { roleController } = require('../controllers');
const { hasOneOfRoles } = require('./middlewares');

router.get(
    '/permissions',
    [hasOneOfRoles('Super')],
    roleController.getPermissions
);
router.get(
    '/permissions/:id',
    [hasOneOfRoles('Super')],
    roleController.getPermission
);
router.get('/', [hasOneOfRoles(['Super', 'Admin'])], roleController.getRoles);
router.get('/:id', [hasOneOfRoles(['Super', 'Admin'])], roleController.getRole);
router.post(
    '/',
    [hasOneOfRoles(['Super', 'Admin'])],
    roleController.createRole
);
router.patch(
    '/:id',
    [hasOneOfRoles(['Super', 'Admin'])],
    roleController.updateRole
);
router.delete(
    '/:id',
    [hasOneOfRoles(['Super', 'Admin'])],
    roleController.deleteRole
);
router.put(
    '/user/:userId/assign/:roleId',
    [hasOneOfRoles(['Super', 'Admin'])],
    roleController.assignRole
);
router.put(
    '/:id/permissions',
    [hasOneOfRoles(['Super', 'Admin'])],
    roleController.updateRolePermissions
);

module.exports = router;
