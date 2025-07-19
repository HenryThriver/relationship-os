# Environment Variables for Vercel Deployment

This document lists all environment variables needed for production deployment.

## Required Environment Variables

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_DB_PASSWORD=your_database_password_here
```

### AI Services
```
ANTHROPIC_API_KEY=sk-ant-api03-your_anthropic_api_key_here
OPENAI_API_KEY=sk-proj-your_openai_api_key_here
```

### Google OAuth & APIs
```
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### External APIs
```
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=linkedin-api8.p.rapidapi.com
```

### Site Configuration (Update after deployment)
```
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
NODE_ENV=production
```

### Stripe (Optional - for payments)
```
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
```

## Setup Instructions

1. **Add to Vercel Dashboard**: 
   - Go to your Vercel project → Settings → Environment Variables
   - Add each variable with its value
   - Set environment to "Production, Preview, and Development"

2. **Update After Deployment**:
   - Replace `NEXT_PUBLIC_SITE_URL` with your actual Vercel domain
   - Update Google OAuth redirect URIs in Google Cloud Console
   - Update Stripe webhook endpoints if using payments

3. **Google OAuth Setup**:
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Add these authorized redirect URIs:
     - `https://your-vercel-domain.vercel.app/api/auth/callback/google`
     - `https://your-vercel-domain.vercel.app/auth/callback`

4. **Stripe Setup** (if using payments):
   - Add webhook endpoint in Stripe dashboard:
     - `https://your-vercel-domain.vercel.app/api/stripe/webhook`
   - Switch to live keys for production

## Security Notes

- Never commit these values to git
- Rotate keys periodically
- Use different keys for development/staging/production
- Monitor API usage and costs