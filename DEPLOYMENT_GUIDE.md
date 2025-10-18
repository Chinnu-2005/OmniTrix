# Complete Deployment Guide - OmniTrix

## Step 1: Backend Deployment (Render)

### 1.1 Prepare Backend for Production

1. **Update CORS Origin in backend/.env:**
   ```env
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```

2. **Ensure your backend/.env has all required variables:**
   ```env
   PORT=3000
   DB_URI=mongodb+srv://gkrvkoushik:koushik@odoo.exdmdwh.mongodb.net
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ACCESS_TOKEN_SECRET=eFqvneiEnijnvijnivfbeqivlnQiv46rt14t1W4ttt1OFNEOFNOEINOn14354989738th3
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=okvepmvepEPP23rnpn003ni390f0pwncpifh049fn2pfn20fj20ifnnkvnp9nr29ngo505pmpgnpgju6im
   REFRESH_TOKEN_EXPIRY=10d
   CLOUDINARY_CLOUD_NAME=koushik-2005
   CLOUDINARY_API_KEY=834242631899582
   CLOUDINARY_SECRET_KEY=NmbdC14ktNL1N9i6SJGSTjrE7uM
   ```

### 1.2 Deploy to Render

1. **Push to GitHub:**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial backend commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/omnitrix-backend.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your backend repository
   - Configure:
     - **Name:** omnitrix-backend
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Instance Type:** Free

3. **Set Environment Variables in Render:**
   - Go to your service → Environment
   - Add all variables from your .env file:
     - `DB_URI`: mongodb+srv://gkrvkoushik:koushik@odoo.exdmdwh.mongodb.net
     - `ACCESS_TOKEN_SECRET`: eFqvneiEnijnvijnivfbeqivlnQiv46rt14t1W4ttt1OFNEOFNOEINOn14354989738th3
     - `ACCESS_TOKEN_EXPIRY`: 1d
     - `REFRESH_TOKEN_SECRET`: okvepmvepEPP23rnpn003ni390f0pwncpifh049fn2pfn20fj20ifnnkvnp9nr29ngo505pmpgnpgju6im
     - `REFRESH_TOKEN_EXPIRY`: 10d
     - `CLOUDINARY_CLOUD_NAME`: koushik-2005
     - `CLOUDINARY_API_KEY`: 834242631899582
     - `CLOUDINARY_SECRET_KEY`: NmbdC14ktNL1N9i6SJGSTjrE7uM
     - `CORS_ORIGIN`: (will update after frontend deployment)

4. **Deploy and Get Backend URL:**
   - Click "Deploy"
   - Note your backend URL: `https://your-backend-name.onrender.com`

## Step 2: Frontend Deployment (Vercel)

### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Update Frontend Environment

1. **Update frontend/.env for production:**
   ```env
   VITE_API_BASE_URL=https://your-backend-name.onrender.com/api/v1
   VITE_SOCKET_URL=https://your-backend-name.onrender.com
   VITE_GEMINI_API_URL=http://10.0.10.142:5001
   VITE_GEMINI_API_TOKEN=Bearer mysecret123
   ```

### 2.3 Deploy Frontend

1. **Deploy to Vercel:**
   ```bash
   cd frontend
   vercel login
   vercel --prod
   ```

2. **Set Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `VITE_API_BASE_URL`: https://your-backend-name.onrender.com/api/v1
     - `VITE_SOCKET_URL`: https://your-backend-name.onrender.com
     - `VITE_GEMINI_API_URL`: http://10.0.10.142:5001
     - `VITE_GEMINI_API_TOKEN`: Bearer mysecret123

3. **Get Frontend URL:**
   - Note your frontend URL: `https://your-frontend-name.vercel.app`

## Step 3: Update Backend CORS

1. **Update CORS_ORIGIN in Render:**
   - Go to Render Dashboard → Your Backend Service → Environment
   - Update `CORS_ORIGIN` to: `https://your-frontend-name.vercel.app`
   - Redeploy backend

## Step 4: AI Service Deployment (Optional - Railway)

### 4.1 Deploy Python AI Service

1. **Create requirements.txt** (already exists)

2. **Deploy to Railway:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables:**
   - `GOOGLE_API_KEY`: your_google_gemini_api_key
   - `SECRET_TOKEN`: mysecret123
   - `PORT`: 5001

4. **Update Frontend Environment:**
   - Update `VITE_GEMINI_API_URL` to Railway URL

## Quick Commands Summary

### Backend Deployment:
```bash
cd backend
git add . && git commit -m "Deploy update" && git push
```

### Frontend Deployment:
```bash
cd frontend
vercel --prod
```

### Full Redeploy:
```bash
# Backend
cd backend && git add . && git commit -m "Redeploy" && git push

# Frontend  
cd frontend && vercel --prod
```

## Troubleshooting

1. **CORS Issues:** Ensure CORS_ORIGIN matches your frontend URL exactly
2. **Environment Variables:** Double-check all env vars are set correctly
3. **Database Connection:** Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
4. **Build Failures:** Check logs in Render/Vercel dashboards

## Production URLs Structure:
- **Backend:** https://omnitrix-backend-xyz.onrender.com
- **Frontend:** https://omnitrix-frontend-xyz.vercel.app
- **AI Service:** https://omnitrix-ai-xyz.railway.app (optional)