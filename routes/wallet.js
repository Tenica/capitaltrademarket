const express = require('express');
const isAuth = require('../middleware/is-auth');
const { getUserWallet, getAdminUserWallet, getAllWallets } = require('../controllers/wallet');
const router = express.Router();

router.get('/view-user-wallet/:id', isAuth, getUserWallet);
router.get('/view-user-wallet-admin/:userId', isAuth, getAdminUserWallet);
router.get('/view-all-wallets', isAuth, getAllWallets);


module.exports = router;