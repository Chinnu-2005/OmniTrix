const Board = require('../models/board');
const Room = require('../models/room');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const getBoard = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await Room.findOne({ roomId });
        if (!room) {
            throw new ApiError(404, "Room not found");
        }

        if (!room.participants.includes(userId)) {
            throw new ApiError(403, "Access denied");
        }

        const board = await Board.findOne({ roomId: room._id })
            .populate('lastModifiedBy', 'username avatar');

        if (!board) {
            throw new ApiError(404, "Board not found");
        }

        res.status(200).json(new ApiResponse(200, "Board fetched successfully", board));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

module.exports = { getBoard };