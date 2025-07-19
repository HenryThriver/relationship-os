#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this after logging into Vercel CLI with: vercel login
# IMPORTANT: Replace placeholder values with your actual API keys before running

echo "Setting up Vercel environment variables..."
echo "WARNING: Make sure to replace placeholder values with your actual API keys"

# Core Supabase variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://your-project.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "your_supabase_anon_key_here"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "your_supabase_service_role_key_here"
vercel env add SUPABASE_DB_PASSWORD production <<< "your_database_password_here"

# AI API Keys
vercel env add ANTHROPIC_API_KEY production <<< "sk-ant-api03-your_anthropic_api_key_here"
vercel env add OPENAI_API_KEY production <<< "sk-proj-your_openai_api_key_here"

# Google OAuth
vercel env add GOOGLE_CLIENT_ID production <<< "your_google_client_id.apps.googleusercontent.com"
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production <<< "your_google_client_id.apps.googleusercontent.com"
vercel env add GOOGLE_CLIENT_SECRET production <<< "your_google_client_secret_here"

# External APIs
vercel env add RAPIDAPI_KEY production <<< "your_rapidapi_key_here"
vercel env add RAPIDAPI_HOST production <<< "linkedin-api8.p.rapidapi.com"

# Environment
vercel env add NODE_ENV production <<< "production"

echo "Environment variables set! Now run 'vercel --prod' to deploy"
echo "After deployment, update NEXT_PUBLIC_SITE_URL with your actual domain"