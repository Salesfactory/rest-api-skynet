const express = require('express');
const router = express.Router();
const { s3controller } = require('../controllers');

router.post('/uploadImage', s3controller.uploadImage);
router.get('/getFileLink', s3controller.getFileLink);

module.exports = router;
