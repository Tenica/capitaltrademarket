const express = require('express');
const isAuth = require('../middleware/is-auth');
const { getUserWallet, getAdminUserWallet, getAllWallets, adminTopUpWallet } = require('../controllers/wallet');
const router = express.Router();

router.get('/view-user-wallet/:id', isAuth, getUserWallet);
router.get('/view-user-wallet-admin/:userId', isAuth, getAdminUserWallet);
router.get('/view-all-wallets', isAuth, getAllWallets);
router.post('/admin-top-up/:userId', isAuth, adminTopUpWallet);

module.exports = router;