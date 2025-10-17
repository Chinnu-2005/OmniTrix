require('dotenv').config('./.env')
const connectDB=require('./db/db');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { handleConnection } = require('./socket/socketHandlers');

const app=require('./app');
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
});

handleConnection(io);

server.listen(process.env.PORT||3000,()=>{
    console.log("Server is running......");  
})

connectDB();