require('dotenv').config('./.env')
const connectDB=require('./db/db');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { handleConnection } = require('./socket/socketHandlers');

const app=require('./app');
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e8
});

// Enable binary support
io.engine.generateId = (req) => {
    return require('crypto').randomBytes(16).toString('hex');
};

handleConnection(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', ()=>{
    console.log(`Server is running on port ${PORT}......`);  
})

connectDB();