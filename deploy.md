# Deployment Guide

## Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `VITE_API_BASE_URL`: Your backend URL
   - `VITE_SOCKET_URL`: Your backend URL
   - `VITE_GEMINI_API_URL`: Your AI service URL
   - `VITE_GEMINI_API_TOKEN`: Your AI service token

## Backend Deployment (Render)

1. **Push to GitHub** (if not already done)

2. **Deploy on Render:**
   - Go to render.com
   - Connect your GitHub repository
   - Select the backend folder
   - Use these settings:
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Set Environment Variables in Render Dashboard:**
   - `MONGODB_URI`: Your MongoDB connection string
   - `ACCESS_TOKEN_SECRET`: Your JWT secret
   - `REFRESH_TOKEN_SECRET`: Your refresh token secret
   - `CORS_ORIGIN`: Your frontend URL
   - `NODE_ENV`: production

## Quick Deploy Commands

### Frontend
```bash
cd frontend && vercel --prod
```

### Backend (via Git)
```bash
git add . && git commit -m "Deploy update" && git push
```