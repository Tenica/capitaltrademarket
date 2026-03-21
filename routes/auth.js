const express = require('express');
const isAuth = require('../middleware/is-auth');
const { 
  createUser, 
  logUser, 
  logoutUser, 
  postReset, 
  getNewPassword, 
  postNewPassword, 
  blockUser, 
  unblockUser, 
  getAllUsers, 
  adminCreateUser,
  generate2FaSecret,
  verifyAndEnable2Fa,
  verifyLogin2Fa
} = require('../controllers/auth');

const router = express.Router();

router.post('/create-user', createUser);
router.post('/login-user', logUser);
router.post('/logout-user', isAuth, logoutUser);
router.post('/reset-password', postReset);
router.get('/reset-password/:token', getNewPassword);
router.post('/change-password/:token', postNewPassword);
router.get('/view-all-users', isAuth, getAllUsers);
router.post('/block-user/:id', isAuth, blockUser);
router.post('/unblock-user/:id', isAuth, unblockUser);
router.post('/admin-create-user', isAuth, adminCreateUser);
router.post('/generate-2fa', isAuth, generate2FaSecret);
router.post('/enable-2fa', isAuth, verifyAndEnable2Fa);
router.post('/verify-2fa', verifyLogin2Fa);

module.exports = router;
