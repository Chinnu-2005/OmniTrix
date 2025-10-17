const Chat = require('../models/chat');
const Room = require('../models/room');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const getRoomMessages = async (req, res) => {
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

        const messages = await Chat.find({ roomId: room._id })
            .populate('sender', 'username avatar')
            .sort({ createdAt: 1 })
            .limit(100);

        res.status(200).json(new ApiResponse(200, "Messages fetched successfully", messages));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

module.exports = { getRoomMessages };