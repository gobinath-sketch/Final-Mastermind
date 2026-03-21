# Supabase Setup Guide

## Quick Start

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details and wait for it to be created

### 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY` - keep this secret!)

### 3. Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 4. Run the Database Schema

You have two options:

#### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

This is the easiest and recommended way. The SQL Editor automatically uses your project's connection, so no connection string is needed.

#### Option B: Using psql Command Line (Advanced)

If you want to run it from the command line, you'll need the database connection string:

1. In Supabase dashboard, go to **Settings** → **Database**
2. Find the **Connection string** section
3. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
4. Replace `[YOUR-PASSWORD]` with your actual database password
5. Run:
   ```bash
   psql "your-connection-string-here" -f supabase-schema.sql
   ```

**Note:** You'll need PostgreSQL client tools installed. On Windows, you can use the Supabase CLI or install PostgreSQL.

### 5. Verify the Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see the following tables:
   - `profiles`
   - `resumes`
   - `jobs_saved`
   - `watchlists`
   - `transactions`
   - `conversations`

3. Check that Row Level Security (RLS) is enabled:
   - Go to **Authentication** → **Policies**
   - You should see policies for each table

## Troubleshooting

### "Connection string is missing" Error

If you're getting this error, it means you're trying to run the SQL in a tool that requires a connection string. 

**Solution:** Use the Supabase SQL Editor instead (Option A above). It doesn't require a connection string because you're already authenticated in the dashboard.

### Environment Variables Not Working

1. Make sure your `.env.local` file is in the `mastermind-app` directory (same level as `package.json`)
2. Restart your Next.js dev server after changing environment variables
3. Environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser

### Schema Already Exists Errors

The schema is designed to be idempotent (safe to run multiple times). If you see errors about existing objects, that's okay - the schema uses `IF NOT EXISTS` and `DO $$ BEGIN ... EXCEPTION` blocks to handle this gracefully.

## Next Steps

After setting up the schema:

1. Test user registration at `/signup`
2. Check that a profile is automatically created in the `profiles` table
3. Verify RLS policies are working by trying to access data from different user accounts

## Security Notes

- Never commit `.env.local` to git (it's already in `.gitignore`)
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS - only use it on the server side
- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose in the browser, but RLS policies protect your data

