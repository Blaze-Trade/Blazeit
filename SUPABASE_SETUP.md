# Supabase Setup Guide for Blaze It

This guide will help you set up Supabase as the backend for the Blaze It application, replacing the previous Wrangler/Cloudflare Workers setup.

## Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. Node.js and npm/bun installed
3. The Blaze It project cloned locally

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `blaze-it` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (usually takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and update the Supabase configuration:
   ```env
   # Supabase Configuration (Required)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
   VITE_SUPABASE_STORAGE_BUCKET=token-images
   ```

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute the schema

This will create all the necessary tables:
- `users` - User accounts (wallet-based authentication)
- `tokens` - Available trading tokens
- `quests` - Competitive trading quests
- `quest_participants` - Users who joined quests
- `quest_portfolios` - Virtual portfolios for quests
- `user_portfolios` - Real trading portfolios
- `watchlists` - User token watchlists
- `transactions` - Transaction history
- `token_creation_requests` - Custom token creation requests
- `leaderboard_entries` - Quest performance data

## Step 5: Set Up Row Level Security (RLS)

The schema includes Row Level Security policies that ensure:
- Users can only access their own data
- Public data (tokens, quests) is readable by everyone
- Proper authentication is enforced

## Step 6: Set Up Storage (Optional)

If you plan to use token image uploads:

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Name it `token-images`
4. Set it to **Public** if you want images to be publicly accessible
5. Configure any additional policies as needed

## Step 7: Install Dependencies and Run

1. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Step 8: Test the Application

1. **Connect Wallet**: Use the wallet connection to authenticate
2. **Browse Tokens**: Check if tokens are loading from Supabase
3. **Create Quest**: Try creating a new quest
4. **Join Quest**: Join an existing quest
5. **Trade Tokens**: Test the trading functionality
6. **View Portfolio**: Check portfolio analysis

## Database Features

### User Management
- Wallet-based authentication
- Automatic user creation on first connection
- User balance management for quest entry fees

### Quest System
- Quest creation and management
- Entry fee collection
- Virtual portfolio tracking
- Performance calculation
- Leaderboard generation

### Trading System
- Real token trading (blockchain integration)
- Portfolio tracking
- Transaction history
- Watchlist management

### Token Management
- Token price tracking
- Custom token creation requests
- Token metadata storage

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check that your `.env` file has the correct Supabase URL and key
   - Restart your development server after updating `.env`

2. **"Failed to fetch tokens"**
   - Verify your Supabase project is active
   - Check that the database schema was applied correctly
   - Ensure RLS policies are properly configured

3. **"User not found" errors**
   - This is normal for new users - they will be created automatically
   - Check the browser console for detailed error messages

4. **Database connection issues**
   - Verify your Supabase project is not paused (free tier limitation)
   - Check your internet connection
   - Ensure your Supabase credentials are correct

### Getting Help

1. Check the browser console for error messages
2. Check the Supabase dashboard logs in **Logs** → **API**
3. Verify your database schema in **Table Editor**
4. Check RLS policies in **Authentication** → **Policies**

## Migration from Wrangler/Workers

The application has been completely migrated from Cloudflare Workers to Supabase:

### What Changed
- ✅ All API endpoints now use Supabase
- ✅ Database operations use Supabase PostgreSQL
- ✅ Authentication uses Supabase Auth
- ✅ File storage uses Supabase Storage
- ✅ Real-time features available via Supabase Realtime

### What Stayed the Same
- ✅ Frontend React application
- ✅ Aptos blockchain integration
- ✅ Wallet connection functionality
- ✅ Trading and quest features
- ✅ UI/UX design

## Next Steps

1. **Deploy to Production**: Set up a production Supabase project
2. **Configure Domain**: Set up custom domain for your Supabase project
3. **Set Up Monitoring**: Configure Supabase monitoring and alerts
4. **Backup Strategy**: Set up automated database backups
5. **Performance Optimization**: Monitor and optimize database queries

## Support

For issues specific to this Supabase setup:
1. Check the Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
2. Review the application logs
3. Check the database schema and RLS policies

The application is now fully functional with Supabase as the backend!
