const express=require('express');
const router=express.Router();
const User=require('../models/user');
const {signup,login}=require('../controllers/user.controller');

router.route('/user-signup').post(signup);
router.route('/user-login').post(login);


module.exports=router;