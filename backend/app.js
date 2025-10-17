const express=require('express');
const cors=require('cors');
const cookieparser=require('cookie-parser');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });


const app=express();

app.use(express.json())
app.use(cors(
    {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
))

app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieparser());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});


//include routes
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/rooms', require('./routes/room.routes'));
app.use('/api/v1/boards', require('./routes/board.routes'));
app.use('/api/v1/chat', require('./routes/chat.routes'));

// AI upload endpoint
app.post('/upload-image', upload.single('file'), (req, res) => {
    try {
        // Check authorization
        const token = req.headers.authorization;
        if (token !== 'Bearer mysecret123') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Demo response since we don't have Gemini API in Node.js backend
        res.json({
            summary: '🤖 AI Analysis\n\nThis whiteboard contains:\n• Drawing elements and shapes\n• Collaborative content\n• Visual annotations\n\nNote: This is a demo response from the main backend. For real AI analysis, integrate with Gemini API.'
        });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Error processing image' });
    }
});



module.exports=app