const express = require('express');
const isAuth = require('../middleware/is-auth');
const { createInvoice, viewSingleInvoice, viewAllInvoice, confirmSingleInvoice, cancelSingleInvoice } = require('../controllers/invoice');
const router = express.Router();

router.post('/create-invoice', isAuth, createInvoice)
router.get('/view-all-invoice', isAuth, viewAllInvoice)
router.get('/view-one-invoice/:id', isAuth, viewSingleInvoice)
// router.post('/confirm-invoice/:id', isAuth, confirmSingleInvoice)
router.post('/cancel-invoice/:id', isAuth, cancelSingleInvoice)

// router.post('/login-user', logUser);
// router.post('/logout-user',isAuth, logoutUser)
// router.post('/reset-password',  postReset);
// router.get('/reset-password/:token', isAuth, getNewPassword)
// router.post('/change-password/:token', postNewPassword)
module.exports = router;