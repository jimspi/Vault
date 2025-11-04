# Critical Fix: Insights Creation Issue

## Problem
Manual insights and AI insights fail to create with a 500 error due to missing Row Level Security (RLS) INSERT policy on the `insights` table.

## Root Cause
The insights table has SELECT and UPDATE policies but is **missing the INSERT policy**, preventing users from creating new insights.

## Solution

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Fix missing INSERT and DELETE policies for insights table

-- Allow users to create insights in their workspaces
CREATE POLICY "Users can create insights in their workspaces"
    ON public.insights FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Allow users to delete insights in their workspaces
CREATE POLICY "Users can delete insights in their workspaces"
    ON public.insights FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = insights.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );
```

5. Click **Run** to execute
6. Verify with: `SELECT * FROM pg_policies WHERE tablename = 'insights';`

### Option 2: Apply via Supabase CLI

If you have the Supabase CLI installed and linked to your project:

```bash
supabase db push
```

This will apply the migration file: `supabase/migrations/20240101000003_fix_insights_rls.sql`

## Verification

After applying the fix:

1. Go to your deployed app: https://vault-mm8poh86a-jimspis-projects.vercel.app/dashboard
2. Navigate to the **Insights** page
3. Click **Create Insight** button
4. Fill in the form and submit
5. The insight should create successfully ✅

## Additional Changes in This Commit

1. ✅ Removed health score stat card
2. ✅ Removed storage used stat card
3. ✅ Removed processing count/tab
4. ✅ Added Canva-style animation to home page
5. ✅ Improved error logging in insight creation API

---

**Note**: Once the SQL is executed in your Supabase database, both manual insight creation and AI insight generation will work properly.
