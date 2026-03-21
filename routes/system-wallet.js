const express = require('express');
const isAuth = require('../middleware/is-auth');
const { createSystemWallet, getSystemWallet, getAllSystemWallets, editSystemWallet, deleteSystemWallet } = require('../controllers/system-wallet');
const router = express.Router();

// Admin
router.post('/create-system-wallet', isAuth, createSystemWallet)
router.get('/get-all-system-wallets', isAuth, getAllSystemWallets)
router.put('/edit-system-wallet/:id', isAuth, editSystemWallet)
router.delete('/delete-system-wallet/:id', isAuth, deleteSystemWallet)

// Public (for users to see where to send crypto)
router.get('/get-system-wallet', isAuth, getSystemWallet)

module.exports = router;
