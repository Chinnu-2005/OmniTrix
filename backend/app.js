const express=require('express');
const cors=require('cors');
const cookieparser=require('cookie-parser');


const app=express();

app.use(express.json())
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
))

app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieparser());

//include routes
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/rooms', require('./routes/room.routes'));
app.use('/api/v1/boards', require('./routes/board.routes'));
app.use('/api/v1/chat', require('./routes/chat.routes'));



module.exports=app