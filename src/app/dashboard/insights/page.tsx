import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { Insight, InsightType } from '@/types';

const insightIcons: Record<InsightType, typeof Lightbulb> = {
  pattern: TrendingUp,
  contradiction: AlertCircle,
  suggestion: Lightbulb,
  reminder: Clock,
  trend: Sparkles,
};

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground">
            AI-generated insights from your documents
            {newCount && newCount > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({newCount} new)
              </span>
            )}
          </p>
        </div>
        <Button variant="outline">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Insights
        </Button>
      </div>

      {!insights || insights.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No insights yet</h3>
            <p className="text-center text-muted-foreground max-w-md mb-6">
              Upload more documents to enable AI-powered insights. We'll automatically detect
              patterns, contradictions, and trends across your content.
            </p>
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate First Insights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight: Insight) => {
            const Icon = insightIcons[insight.type];
            const isNew = insight.status === 'new';

            return (
              <Card key={insight.id} className={isNew ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          {isNew && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(insight.created_at)} • {insight.type}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-4 whitespace-pre-wrap">
                    {insight.content}
                  </CardDescription>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Related Documents
                    </Button>
                    {isNew && (
                      <Button size="sm" variant="ghost">
                        Mark as Viewed
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
