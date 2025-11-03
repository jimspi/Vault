'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertCircle, Sparkles, Clock, Plus, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { Insight, InsightType } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import CreateInsightDialog from './CreateInsightDialog';
import { useRouter } from 'next/navigation';

const insightIcons: Record<InsightType, typeof Lightbulb> = {
  pattern: TrendingUp,
  contradiction: AlertCircle,
  suggestion: Lightbulb,
  reminder: Clock,
  trend: Sparkles,
};

interface InsightsPageClientProps {
  workspaceId: string;
  initialInsights: Insight[];
  newCount: number;
  generationLimit: {
    daily: number;
    used: number;
    remaining: number;
  };
}

export default function InsightsPageClient({
  workspaceId,
  initialInsights,
  newCount,
  generationLimit,
}: InsightsPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGenerateInsights = async () => {
    if (generationLimit.remaining <= 0) {
      toast({
        title: 'Daily Limit Reached',
        description: `You've used all ${generationLimit.daily} AI generations today. Try again tomorrow or create manual insights.`,
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: 'Daily Limit Reached',
            description: data.message,
            variant: 'destructive',
          });
        } else {
          throw new Error(data.message || 'Failed to generate insights');
        }
        return;
      }

      toast({
        title: 'Insights Generated!',
        description: `Created ${data.insights.length} new insights. ${data.limit.remaining} generations remaining today.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate insights',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
            <p className="text-muted-foreground">
              AI-generated and manual insights from your documents
              {newCount > 0 && (
                <span className="ml-2 text-primary font-medium">
                  ({newCount} new)
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Insight
            </Button>
            <Button
              onClick={handleGenerateInsights}
              disabled={generating || generationLimit.remaining <= 0}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Generate ({generationLimit.remaining}/{generationLimit.daily})
                </>
              )}
            </Button>
          </div>
        </div>

        {generationLimit.used > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 inline mr-1" />
                AI Generations: {generationLimit.used}/{generationLimit.daily} used today
                {generationLimit.remaining > 0 && (
                  <span className="text-primary font-medium">
                    {' '}• {generationLimit.remaining} remaining
                  </span>
                )}
                {generationLimit.remaining === 0 && (
                  <span className="text-destructive font-medium">
                    {' '}• Limit reached. Resets tomorrow.
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {initialInsights.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No insights yet</h3>
              <p className="text-center text-muted-foreground max-w-md mb-6">
                Upload documents and generate AI insights, or create your own manual insights
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Manual Insight
                </Button>
                <Button onClick={handleGenerateInsights} disabled={generating}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Insights
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {initialInsights.map((insight: Insight) => {
              const Icon = insightIcons[insight.type];
              const isNew = insight.status === 'new';
              const isManual = insight.metadata && (insight.metadata as any).source === 'manual';

              return (
                <Card key={insight.id} className={isNew ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            {isNew && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                New
                              </span>
                            )}
                            {isManual && (
                              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                                Manual
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
                      {!isManual && insight.related_documents && (insight.related_documents as any[]).length > 0 && (
                        <Button size="sm" variant="outline">
                          View {(insight.related_documents as any[]).length} Related Document{(insight.related_documents as any[]).length === 1 ? '' : 's'}
                        </Button>
                      )}
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

      {showCreateDialog && (
        <CreateInsightDialog
          workspaceId={workspaceId}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
