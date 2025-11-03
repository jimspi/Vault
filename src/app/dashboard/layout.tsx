import { requireProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import DashboardNav from '@/components/dashboard/DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = createClient();

  // Get user's workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false });

  // If no workspaces, create a default one
  if (!workspaces || workspaces.length === 0) {
    const { data: newWorkspace } = await supabase
      .from('workspaces')
      .insert({
        owner_id: profile.id,
        name: 'My Vault',
        description: 'Your personal knowledge vault',
      })
      .select()
      .single();

    if (newWorkspace) {
      workspaces?.push(newWorkspace);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav profile={profile} workspaces={workspaces || []} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
