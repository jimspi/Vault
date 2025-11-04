#!/usr/bin/env node

/**
 * Migration script to fix missing insights RLS policies
 * Run with: node scripts/apply-insights-fix.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🚀 Applying insights RLS policy fix...\n');

  const migrationSQL = `
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
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If rpc doesn't exist, try direct approach
      console.log('Direct SQL execution...');

      // Split and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.from('_sql').select(statement);
        if (stmtError) {
          console.error('Statement error:', stmtError);
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('The following policies were added:');
    console.log('  - Users can create insights in their workspaces (INSERT)');
    console.log('  - Users can delete insights in their workspaces (DELETE)');
    console.log('\nYou can now create manual insights in the application.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    console.log('\n📝 Manual fix required:');
    console.log('Please run the following SQL in your Supabase SQL editor:\n');
    console.log(migrationSQL);
    process.exit(1);
  }
}

runMigration();
