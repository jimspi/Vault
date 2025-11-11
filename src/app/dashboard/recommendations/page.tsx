import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import RecommendationsPanel from '@/components/dashboard/RecommendationsPanel';

export default async function RecommendationsPage() {
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
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto">
      <RecommendationsPanel workspaceId={workspace.id} />
    </div>
  );
}
