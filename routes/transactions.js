const express = require('express');
const isAuth = require('../middleware/is-auth');
const { viewTransaction, viewAllUserTransactions } = require('../controllers/transactions');
const router = express.Router();

router.get('/transaction/:id', isAuth, viewTransaction)
router.get('/getAllTransaction', isAuth, viewAllUserTransactions)
// router.post('/login-user', logUser);
// router.post('/logout-user',isAuth, logoutUser)
// router.post('/reset-password',  postReset);
// router.get('/reset-password/:token', isAuth, getNewPassword)
// router.post('/change-password/:token', postNewPassword)
module.exports = router;