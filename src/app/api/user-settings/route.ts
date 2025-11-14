import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch user settings
export async function GET(_request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Try to get existing settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no settings exist, create default settings
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          timezone: 'America/Denver',
          email_notifications: true,
          in_app_notifications: true,
          auto_recommendations_enabled: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[UserSettings] Failed to create default settings:', insertError);
        return NextResponse.json(
          { error: 'Failed to create settings' },
          { status: 500 }
        );
      }

      return NextResponse.json({ settings: newSettings });
    }

    if (error) {
      console.error('[UserSettings] Failed to fetch settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[UserSettings] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      timezone,
      email_notifications,
      in_app_notifications,
      auto_recommendations_enabled,
    } = body;

    const supabase = createClient();

    // Build update object with only provided fields
    const updates: any = {};
    if (timezone !== undefined) updates.timezone = timezone;
    if (email_notifications !== undefined) updates.email_notifications = email_notifications;
    if (in_app_notifications !== undefined) updates.in_app_notifications = in_app_notifications;
    if (auto_recommendations_enabled !== undefined)
      updates.auto_recommendations_enabled = auto_recommendations_enabled;

    // Try to update existing settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    // If no settings exist, create them
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          timezone: timezone || 'America/Denver',
          email_notifications: email_notifications ?? true,
          in_app_notifications: in_app_notifications ?? true,
          auto_recommendations_enabled: auto_recommendations_enabled ?? true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[UserSettings] Failed to create settings:', insertError);
        return NextResponse.json(
          { error: 'Failed to create settings' },
          { status: 500 }
        );
      }

      return NextResponse.json({ settings: newSettings });
    }

    if (error) {
      console.error('[UserSettings] Failed to update settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[UserSettings] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
