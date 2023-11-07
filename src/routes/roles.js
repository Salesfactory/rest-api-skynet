const express = require('express');
const router = express.Router();
const { roleController } = require('../controllers');
const { hasRole } = require('./middlewares');

router.get('/permissions', [hasRole('Super')], roleController.getPermissions);
router.get(
    '/permissions/:id',
    [hasRole('Super')],
    roleController.getPermission
);
router.get('/', [hasRole('Super')], roleController.getRoles);
router.get('/:id', [hasRole('Super')], roleController.getRole);

router.post('/', [hasRole('Super')], roleController.createRole);
router.patch('/:id', [hasRole('Super')], roleController.updateRole);
router.delete('/:id', [hasRole('Super')], roleController.deleteRole);

module.exports = router;
