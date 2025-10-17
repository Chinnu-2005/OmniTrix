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

        let board = await Board.findOne({ roomId: room._id })
            .populate('lastModifiedBy', 'username avatar');

        if (!board) {
            // Create empty board if none exists
            board = await Board.create({
                roomId: room._id,
                elements: [],
                lastModifiedBy: userId
            });
        }

        res.status(200).json(new ApiResponse(200, "Board fetched successfully", board));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

const saveBoard = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { imageData } = req.body;
        const userId = req.user._id;

        const room = await Room.findOne({ roomId });
        if (!room) {
            throw new ApiError(404, "Room not found");
        }

        if (!room.participants.includes(userId)) {
            throw new ApiError(403, "Access denied");
        }

        let board = await Board.findOne({ roomId: room._id });
        
        if (!board) {
            board = await Board.create({
                roomId: room._id,
                elements: [],
                imageData,
                lastModifiedBy: userId
            });
        } else {
            board.imageData = imageData;
            board.lastModifiedBy = userId;
            await board.save();
        }

        res.status(200).json(new ApiResponse(200, "Board saved successfully", board));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

module.exports = { getBoard, saveBoard };