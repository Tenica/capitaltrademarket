const express = require('express');
const isAuth = require('../middleware/is-auth');
const { getHistoryData } = require('../controllers/history');
const router = express.Router();

router.get('/growth-data', isAuth, getHistoryData);

module.exports = router;
