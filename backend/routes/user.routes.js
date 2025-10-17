const express=require('express');
const router=express.Router();
const User=require('../models/user');
const {signup,login,logout}=require('../controllers/user.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.route('/user-signup').post(signup);
router.route('/user-login').post(login);
router.route('/user-logout').post(verifyJWT, logout);


module.exports=router;