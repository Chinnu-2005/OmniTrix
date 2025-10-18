#!/bin/bash

echo "Starting OmniTrix Deployment..."

echo ""
echo "========================================"
echo "STEP 1: Deploying Backend to Render"
echo "========================================"
cd backend
git add .
git commit -m "Backend deployment update - $(date)"
git push
echo "Backend pushed to GitHub - Check Render for auto-deployment"

echo ""
echo "========================================"
echo "STEP 2: Deploying Frontend to Vercel"
echo "========================================"
cd ../frontend
vercel --prod
echo "Frontend deployed to Vercel"

echo ""
echo "========================================"
echo "DEPLOYMENT COMPLETE!"
echo "========================================"
echo "Don't forget to:"
echo "1. Update CORS_ORIGIN in Render with your Vercel URL"
echo "2. Update frontend env vars in Vercel dashboard"
echo "3. Test both services are working"