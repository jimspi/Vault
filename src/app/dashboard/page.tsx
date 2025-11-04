import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import DocumentsView from '@/components/dashboard/DocumentsView';
import UploadZone from '@/components/dashboard/UploadZone';
import StatsCards from '@/components/dashboard/StatsCards';
import InsightsFeed from '@/components/dashboard/InsightsFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('status', 'new')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
        {workspace.description && (
          <p className="text-muted-foreground">{workspace.description}</p>
        )}
      </div>

      <StatsCards
        workspaceId={workspace.id}
        documentCount={documentCount || 0}
      />

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="insights">
            Insights {insights && insights.length > 0 && `(${insights.length})`}
          </TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <DocumentsView workspaceId={workspace.id} initialDocuments={documents || []} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <InsightsFeed workspaceId={workspace.id} initialInsights={insights || []} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <UploadZone workspaceId={workspace.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
