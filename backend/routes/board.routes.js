const express = require('express');
const router = express.Router();
const { getBoard, saveBoard } = require('../controllers/board.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.use(verifyJWT);

router.route('/:roomId').get(getBoard).post(saveBoard);

module.exports = router;