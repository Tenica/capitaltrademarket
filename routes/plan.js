const express = require('express');
const isAuth = require('../middleware/is-auth');
const { createPlan, getPlan, getMatchingPlans, editPlan, deletePlan } = require('../controllers/plan');
const router = express.Router();

router.post('/create-plan', isAuth, createPlan)
router.get('/get-plan', isAuth, getPlan)
router.get('/get-matching-plans', isAuth, getMatchingPlans)
router.put('/edit-plan/:id', isAuth, editPlan)
router.delete('/delete-plan/:id', isAuth, deletePlan)
// router.post('/login-user', logUser);
// router.post('/logout-user',isAuth, logoutUser)
// router.post('/reset-password',  postReset);
// router.get('/reset-password/:token', isAuth, getNewPassword)
// router.post('/change-password/:token', postNewPassword)
module.exports = router;
