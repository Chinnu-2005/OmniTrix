const Room = require('../models/room');
const Board = require('../models/board');
const Chat = require('../models/chat');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id).select('-password -refreshToken');
        
        if (!user) {
            return next(new Error('Authentication error'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
};

const handleConnection = (io) => {
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        console.log(`User ${socket.user.username} connected`);

        socket.on('join-room', async (roomCode) => {
            console.log(`User ${socket.user.username} attempting to join room: ${roomCode}`);
            
            try {
                const room = await Room.findOne({ roomId: roomCode });
                if (!room) {
                    console.log(`Room ${roomCode} not found`);
                    socket.emit('error', 'Room not found');
                    return;
                }
                
                if (!room.participants.includes(socket.userId)) {
                    console.log(`User ${socket.userId} not in participants list for room ${roomCode}`);
                    socket.emit('error', 'Access denied');
                    return;
                }

                socket.join(roomCode);
                socket.roomCode = roomCode;
                
                console.log(`User ${socket.user.username} successfully joined room: ${roomCode}`);
                
                socket.to(roomCode).emit('user-joined', {
                    userId: socket.userId,
                    username: socket.user.username,
                    avatar: socket.user.avatar
                });
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', 'Failed to join room');
            }
        });

        socket.on('drawing-update', async (data) => {
            if (!socket.roomCode) return;

            try {
                // Broadcast drawing data to other users in the room
                socket.to(socket.roomCode).emit('drawing-update', {
                    ...data,
                    userId: socket.userId,
                    username: socket.user.username
                });

                // Save to database for persistence (except cursor movements)
                if (data.type === 'clear') {
                    const room = await Room.findOne({ roomId: socket.roomCode });
                    if (room) {
                        const board = await Board.findOne({ roomId: room._id });
                        if (board) {
                            await board.clearBoard(socket.userId);
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling drawing update:', error);
                socket.emit('error', 'Failed to update drawing');
            }
        });

        socket.on('chat-message', async (message) => {
            if (!socket.roomCode) return;

            try {
                const room = await Room.findOne({ roomId: socket.roomCode });
                
                const chatMessage = await Chat.create({
                    roomId: room._id,
                    sender: socket.userId,
                    message: message.text
                });

                const populatedMessage = await Chat.findById(chatMessage._id)
                    .populate('sender', 'username avatar');

                // Send to all users in the room (including sender for immediate feedback)
                io.to(socket.roomCode).emit('chat-message', populatedMessage);
            } catch (error) {
                socket.emit('error', 'Failed to send message');
            }
        });

        socket.on('voice-toggle', (data) => {
            if (!socket.roomCode) return;
            
            socket.to(socket.roomCode).emit('voice-toggle', {
                userId: socket.userId,
                username: socket.user.username,
                isEnabled: data.isEnabled
            });
        });

        socket.on('disconnect', () => {
            if (socket.roomCode) {
                socket.to(socket.roomCode).emit('user-left', {
                    userId: socket.userId,
                    username: socket.user.username
                });
            }
            console.log(`User ${socket.user.username} disconnected`);
        });
    });
};

module.exports = { handleConnection };