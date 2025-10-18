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

        // --- Room Join ---
        socket.on('join-room', async (roomCode) => {
            console.log(`User ${socket.user.username} attempting to join room: ${roomCode}`);
            
            try {
                const room = await Room.findOne({ roomId: roomCode });
                if (!room) {
                    socket.emit('error', 'Room not found');
                    return;
                }
                
                if (!room.participants.includes(socket.userId)) {
                    socket.emit('error', 'Access denied');
                    return;
                }

                socket.join(roomCode);
                socket.roomCode = roomCode;
                
                socket.to(roomCode).emit('user-joined', {
                    userId: socket.userId,
                    username: socket.user.username,
                    avatar: socket.user.avatar
                });

                console.log(`✅ ${socket.user.username} joined room ${roomCode}`);
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', 'Failed to join room');
            }
        });

        // --- Drawing Updates ---
        socket.on('drawing-update', async (data) => {
            if (!socket.roomCode) return;

            try {
                socket.to(socket.roomCode).emit('drawing-update', {
                    ...data,
                    userId: socket.userId
                });

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

        // --- Chat Message ---
        socket.on('chat-message', async (message) => {
            console.log(`💬 Chat message from ${socket.user.username}:`, message);
            
            if (!socket.roomCode) {
                console.log('❌ No room code found');
                return;
            }

            try {
                const room = await Room.findOne({ roomId: socket.roomCode });
                if (!room) {
                    console.log(`❌ Room not found: ${socket.roomCode}`);
                    socket.emit('error', 'Room not found');
                    return;
                }
                
                const chatMessage = await Chat.create({
                    roomId: room._id,
                    sender: socket.userId,
                    message: message.text
                });

                const populatedMessage = await Chat.findById(chatMessage._id)
                    .populate('sender', 'username avatar');

                console.log(`📤 Broadcasting to room ${socket.roomCode}:`, populatedMessage.message);
                
                // Broadcast to ALL users in the room
                io.to(socket.roomCode).emit('chat-message', populatedMessage);
                
                console.log(`✅ Message sent successfully`);
            } catch (error) {
                console.error('❌ Error sending message:', error);
                socket.emit('error', 'Failed to send message');
            }
        });

        // --- Voice Chat Events ---
        socket.on('voice-toggle', (data) => {
            if (!socket.roomCode) return;
            console.log(`🎤 ${socket.user.username} voice ${data.isActive ? 'ON' : 'OFF'}`);
            socket.to(socket.roomCode).emit('voice-toggle', {
                userId: socket.userId,
                username: socket.user.username,
                isActive: data.isActive
            });
        });

        socket.on('voice-chunk', (data) => {
            if (!socket.roomCode) return;
            console.log(`🎵 Audio chunk from ${socket.user.username}, size: ${data.chunk?.byteLength || 0}`);
            // Broadcast binary audio chunk to all other users in the room (no echo)
            socket.to(socket.roomCode).emit('voice-chunk', {
                from: socket.userId,
                username: socket.user.username,
                chunk: data.chunk
            });
        });

        socket.on('voice-data', (data) => {
            if (!socket.roomCode) return;
            console.log(`🎵 Audio from ${socket.user.username}, blob size: ${data.audioBlob?.length || 0}`);
            // Broadcast audio data to all other users in the room
            socket.to(socket.roomCode).emit('voice-data', {
                userId: socket.userId,
                username: socket.user.username,
                audioBlob: data.audioBlob
            });
        });

        // --- Disconnect ---
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
