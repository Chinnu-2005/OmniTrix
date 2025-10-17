const Room = require('../models/room');
const Board = require('../models/board');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { generateRoomCode } = require('../utils/roomCodeGenerator');

const createRoom = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user._id;

        if (!name) {
            throw new ApiError(400, "Room name is required");
        }

        let roomCode;
        let existingRoom;
        do {
            roomCode = generateRoomCode();
            existingRoom = await Room.findOne({ roomId: roomCode });
        } while (existingRoom);

        const room = await Room.create({
            roomId: roomCode,
            name,
            createdBy: userId,
            participants: [userId]
        });

        await Board.create({
            roomId: room._id,
            elements: [],
            lastModifiedBy: userId
        });

        const populatedRoom = await Room.findById(room._id)
            .populate('createdBy', 'username avatar')
            .populate('participants', 'username avatar');

        res.status(201).json(new ApiResponse(201, "Room created successfully", populatedRoom));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

const joinRoom = async (req, res) => {
    try {
        const { roomCode } = req.body;
        const userId = req.user._id;

        if (!roomCode) {
            throw new ApiError(400, "Room code is required");
        }

        const room = await Room.findOne({ roomId: roomCode });
        if (!room) {
            throw new ApiError(404, "Room not found");
        }

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

        const populatedRoom = await Room.findById(room._id)
            .populate('createdBy', 'username avatar')
            .populate('participants', 'username avatar');

        res.status(200).json(new ApiResponse(200, "Joined room successfully", populatedRoom));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

const getUserRooms = async (req, res) => {
    try {
        const userId = req.user._id;

        const rooms = await Room.find({ participants: userId })
            .populate('createdBy', 'username avatar')
            .populate('participants', 'username avatar')
            .sort({ updatedAt: -1 });

        res.status(200).json(new ApiResponse(200, "Rooms fetched successfully", rooms));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

module.exports = { createRoom, joinRoom, getUserRooms };