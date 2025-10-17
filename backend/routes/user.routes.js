const express=require('express');
const router=express.Router();
const User=require('../models/user');
const {signup,login,logout,getProfile,updateProfile}=require('../controllers/user.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/multer.middleware');

router.route('/user-signup').post(signup);
router.route('/user-login').post(login);
router.route('/user-logout').post(verifyJWT, logout);
router.route('/profile').get(verifyJWT, getProfile).put(verifyJWT, upload.single('avatar'), updateProfile);


module.exports=router;