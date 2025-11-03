import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import SearchView from '@/components/dashboard/SearchView';

export default async function SearchPage() {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Find content across all your documents using AI-powered semantic search
        </p>
      </div>

      <SearchView workspaceId={workspace.id} />
    </div>
  );
}
