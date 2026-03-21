const express = require('express');
const isAuth = require('../middleware/is-auth');
const { createWithdrawalRequest, viewAllWithdrawalRequest, viewSingleWithdrawalRequest, confirmWithdrawalRequest, declineWithdrawalRequest } = require('../controllers/withdrawals');
const router = express.Router();

router.post('/create-withdrawal-request', isAuth, createWithdrawalRequest);
router.get('/view-all-withdrawal-request', isAuth, viewAllWithdrawalRequest)
router.get('/view-one-withdrawal-request/:id', isAuth, viewSingleWithdrawalRequest)
router.post('/confirm-withdrawal-request/:id', isAuth, confirmWithdrawalRequest)
router.post('/decline-withdrawal-request/:id', isAuth, declineWithdrawalRequest)

// router.post('/login-user', logUser);
// router.post('/logout-user',isAuth, logoutUser)
// router.post('/reset-password',  postReset);
// router.get('/reset-password/:token', isAuth, getNewPassword)
// router.post('/change-password/:token', postNewPassword)
module.exports = router;