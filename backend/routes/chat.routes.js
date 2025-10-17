const express = require('express');
const router = express.Router();
const { getRoomMessages } = require('../controllers/chat.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.use(verifyJWT);

router.route('/:roomId').get(getRoomMessages);

module.exports = router;