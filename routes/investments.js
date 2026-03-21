const express = require('express');
const isAuth = require('../middleware/is-auth');
const {updateAllUserInvestments, viewAllInvestments, viewUserInvestments} = require('../controllers/investments');
const router = express.Router();

router.get('/view-all-investments', isAuth, viewAllInvestments)
router.get('/view-user-investments', isAuth, viewUserInvestments)
router.get('/update-investment', isAuth, updateAllUserInvestments)
router.get('/update-investment/:userId', isAuth, updateAllUserInvestments)

module.exports = router;