const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getUserRooms } = require('../controllers/room.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.use(verifyJWT);

router.route('/create').post(createRoom);
router.route('/join').post(joinRoom);
router.route('/').get(getUserRooms);

module.exports = router;