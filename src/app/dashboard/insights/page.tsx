import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import InsightsPageClient from '@/components/dashboard/InsightsPageClient';

const DAILY_GENERATION_LIMIT = 5;

export default async function InsightsPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  // Get user's first workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!workspace) {
    return <div>No workspace found</div>;
  }

  // Get all insights
  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Get count by status
  const { count: newCount } = await supabase
    .from('insights')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .eq('status', 'new');

  // Calculate generation limit
  const metadata = (workspace.settings as any) || {};
  const today = new Date().toISOString().split('T')[0];
  const lastGeneratedDate = metadata.lastGeneratedDate;
  const generationsToday = lastGeneratedDate === today ? (metadata.generationsToday || 0) : 0;

  const generationLimit = {
    daily: DAILY_GENERATION_LIMIT,
    used: generationsToday,
    remaining: Math.max(0, DAILY_GENERATION_LIMIT - generationsToday),
  };

  return (
    <InsightsPageClient
      workspaceId={workspace.id}
      initialInsights={insights || []}
      newCount={newCount || 0}
      generationLimit={generationLimit}
    />
  );
}
