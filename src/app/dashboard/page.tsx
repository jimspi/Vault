import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default async function DashboardPage() {
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

  // Get workspace stats
  const { data: documents, count: documentCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: false })
    .eq('workspace_id', workspace.id)
    .eq('status', 'ready')
    .order('upload_date', { ascending: false })
    .limit(20);

  // Get ALL insights (not just status='new')
  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  return (
    <DashboardLayout
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceDescription={workspace.description}
      insights={insights || []}
      documents={documents || []}
      documentCount={documentCount || 0}
    />
  );
}
