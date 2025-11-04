'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Lightbulb, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import InsightGenerationOverlay from './InsightGenerationOverlay';

interface DashboardClientProps {
  workspaceId: string;
  documentCount: number;
  hasInsights: boolean;
}

export default function DashboardClient({
  workspaceId,
  documentCount,
  hasInsights,
}: DashboardClientProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGenerateInsights = async () => {
    if (documentCount === 0) {
      toast({
        title: 'No Documents',
        description: 'Upload at least one document to generate AI insights.',
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
            description: data.message || 'You have reached your daily limit for AI insight generation.',
            variant: 'destructive',
          });
        } else if (response.status === 400) {
          toast({
            title: 'Cannot Generate Insights',
            description: data.message || 'No documents available for analysis.',
            variant: 'destructive',
          });
        } else {
          throw new Error(data.error || 'Failed to generate insights');
        }
        setGenerating(false);
        return;
      }

      // Wait a bit to show the animation completing
      setTimeout(() => {
        setGenerating(false);
        toast({
          title: 'Insights Generated!',
          description: `Created ${data.insights.length} new insights. Check the Insights tab to view them.`,
        });
        router.refresh();
      }, 1000);
    } catch (error) {
      setGenerating(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate insights',
        variant: 'destructive',
      });
    }
  };

  const handleCreateManualInsight = () => {
    router.push('/dashboard/insights');
  };

  return (
    <>
      {/* AI Insight Generation Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">AI Insights</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {hasInsights
                  ? 'Generate more AI-powered insights from your documents or create custom insights manually.'
                  : 'Let AI analyze your documents to discover patterns, connections, and actionable insights.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleGenerateInsights}
                  disabled={generating || documentCount === 0}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  {generating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Insights
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCreateManualInsight}
                  variant="outline"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Manual Insight
                </Button>
              </div>
              {documentCount === 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Upload documents first to enable AI insight generation
                </p>
              )}
            </div>
            <div className="hidden md:block ml-4">
              <Lightbulb className="h-16 w-16 text-primary/20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Overlay */}
      {generating && <InsightGenerationOverlay documentCount={documentCount} />}
    </>
  );
}
