# OmniTrix - AI-Powered Collaborative Whiteboard

A real-time collaborative whiteboard application with AI-powered content analysis, built with React, Node.js, and Google Gemini AI.

## 🚀 Features

### Core Functionality
- **Real-time Collaboration**: Multiple users can draw simultaneously with live cursor tracking
- **Drawing Tools**: Pen, eraser, rectangle, circle with customizable colors and stroke width
- **Room Management**: Create and join rooms with unique codes
- **Real-time Chat**: Built-in messaging system for each room
- **Voice Chat**: Binary audio transmission with low-latency playback and speaking indicators
- **Board Persistence**: Auto-save and restore whiteboard content

### AI Integration
- **AI Content Analysis**: Powered by Google Gemini AI
- **Smart Summaries**: Generate concise summaries of whiteboard content
- **Visual Recognition**: Analyze drawings, shapes, text, and colors
- **Local AI Service**: Run AI processing locally for privacy

### User Experience
- **User Authentication**: Secure signup/login system
- **Responsive Design**: Works on desktop and mobile devices
- **Export Options**: Download as PNG or PDF
- **Profile Management**: User avatars and profile customization
- **Participants Panel**: Real-time speaking indicators and user status

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Socket.io-client** for real-time communication
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time features
- **JWT** for authentication
- **bcrypt** for password hashing

### AI Service
- **Python Flask** for AI API
- **Google Gemini AI** for image analysis
- **Pillow** for image processing
- **python-dotenv** for configuration

## 📁 Project Structure

```
OmniTrix/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── lib/            # API and socket clients
│   │   └── App.tsx         # Main app component
│   └── package.json
├── backend/                 # Node.js backend
│   ├── controllers/        # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middlewares/       # Custom middlewares
│   ├── socket/            # Socket.io handlers
│   ├── utils/             # Utility functions
│   ├── app.js             # Express app setup
│   └── server.js          # Server entry point
├── app.py                  # Python AI service
├── requirements.txt        # Python dependencies
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB
- Google Gemini API key

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/omnitrix
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Start backend:
```bash
npm start
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. AI Service Setup

```bash
# Install Python dependencies
pip install -r requirements.txt
```

Create `.env` file in root:
```env
GOOGLE_API_KEY=your_google_gemini_api_key
SECRET_TOKEN=mysecret123
PORT=5001
```

Start AI service:
```bash
python app.py
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- `MONGODB_URI`: MongoDB connection string
- `ACCESS_TOKEN_SECRET`: JWT access token secret
- `REFRESH_TOKEN_SECRET`: JWT refresh token secret
- `CORS_ORIGIN`: Frontend URL for CORS

#### Frontend (.env)
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_SOCKET_URL`: Socket.io server URL
- `VITE_GEMINI_API_URL`: AI service URL
- `VITE_GEMINI_API_TOKEN`: AI service authentication token

#### AI Service (.env)
- `GOOGLE_API_KEY`: Google Gemini API key
- `SECRET_TOKEN`: API authentication token
- `PORT`: AI service port (default: 5001)

## 📡 API Endpoints

### Authentication
- `POST /api/v1/users/user-signup` - User registration
- `POST /api/v1/users/user-login` - User login
- `POST /api/v1/users/user-logout` - User logout
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Rooms
- `POST /api/v1/rooms/create` - Create new room
- `POST /api/v1/rooms/join` - Join existing room
- `GET /api/v1/rooms` - Get user's rooms

### Board & Chat
- `GET /api/v1/boards/:roomId` - Get board data
- `POST /api/v1/boards/:roomId` - Save board data
- `GET /api/v1/chat/:roomId` - Get chat messages

### AI Service
- `POST /ai/upload-image` - Analyze whiteboard image
- `GET /ai/models` - List available AI models
- `GET /ai/health` - Health check

## 🔌 Socket Events

### Client → Server
- `join-room` - Join a room
- `drawing-update` - Send drawing updates
- `chat-message` - Send chat message
- `voice-toggle` - Toggle voice status
- `voice-chunk` - Send binary audio chunks
- `voice-data` - Send audio data (fallback)

### Server → Client
- `user-joined` - User joined notification
- `user-left` - User left notification
- `drawing-update` - Receive drawing updates
- `chat-message` - Receive chat message
- `voice-toggle` - Voice status update
- `voice-chunk` - Receive binary audio chunks
- `voice-data` - Receive audio data (fallback)

## 🤖 AI Features

### Supported Analysis
- **Shape Recognition**: Rectangles, circles, lines, freehand drawings
- **Text Detection**: Handwritten and typed text
- **Color Analysis**: Identify colors used in drawings
- **Content Summarization**: Generate brief descriptions of whiteboard content

### AI Models Used
- Gemini 2.5 Flash (primary)
- Gemini 2.0 Flash (fallback)
- Gemini Flash Latest (fallback)
- Gemini 2.5 Pro (fallback)

## 🚀 Deployment

### Local Development
1. Start MongoDB
2. Run backend: `npm start` (port 3000)
3. Run frontend: `npm run dev` (port 5173)
4. Run AI service: `python app.py` (port 5001)

### Production Deployment
- Backend: Deploy to services like Render, Railway, or AWS
- Frontend: Deploy to Vercel, Netlify, or similar
- AI Service: Deploy to Python hosting services
- Database: Use MongoDB Atlas or similar cloud database

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for image analysis capabilities
- Socket.io for real-time communication
- MongoDB for data persistence
- React and Node.js communities

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

**Made with ❤️ by [Your Name]**