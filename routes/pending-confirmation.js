const express = require('express');
const isAuth = require('../middleware/is-auth');
const {  viewAllPendingCreditConfirmation, viewSinglePendingConfirmation, viewAllPendingWithdrawalConfirmation, viewAllUserPendingCreditConfirmation, viewAllUserPendingWithdrawalConfirmation, confirmSinglePendingConfirmation } = require('../controllers/pending-confirmation');
const router = express.Router();

router.post('/confirm-pending-confirmation/:id', isAuth, confirmSinglePendingConfirmation)

router.get('/view-all-pending-confirmation', isAuth, viewAllPendingCreditConfirmation)
router.get('/view-one-pending-confirmation/:id', isAuth, viewSinglePendingConfirmation)
router.get('/view-all-pending-withdrawal', isAuth, viewAllPendingWithdrawalConfirmation)

//user
router.get('/view-all-user-pending-confirmation', isAuth, viewAllUserPendingCreditConfirmation)
router.get('/view-all-user-withdrawal-confirmation/:id', isAuth, viewAllUserPendingWithdrawalConfirmation)



 
 

// router.post('/login-user', logUser);
// router.post('/logout-user',isAuth, logoutUser)
// router.post('/reset-password',  postReset);
// router.get('/reset-password/:token', isAuth, getNewPassword)
// router.post('/change-password/:token', postNewPassword)
module.exports = router;