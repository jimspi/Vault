'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CreateInsightDialog from './CreateInsightDialog';
import InsightGenerationOverlay from './InsightGenerationOverlay';

interface FloatingActionButtonsProps {
  workspaceId: string;
  documentCount: number;
  hasInsights: boolean;
}

export default function FloatingActionButtons({
  workspaceId,
  documentCount,
  hasInsights,
}: FloatingActionButtonsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGenerateInsights = async () => {
    if (documentCount === 0 && !hasInsights) {
      toast({
        title: 'No Content to Analyze',
        description: 'Upload documents or create manual insights first.',
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
            description: data.message || 'Try again tomorrow.',
            variant: 'destructive',
          });
        } else if (response.status === 400) {
          toast({
            title: 'Cannot Generate',
            description: data.message || 'No content available.',
            variant: 'destructive',
          });
        } else {
          throw new Error(data.error || 'Failed to generate insights');
        }
        setGenerating(false);
        return;
      }

      setTimeout(() => {
        setGenerating(false);
        toast({
          title: 'Insights Generated!',
          description: `Created ${data.insights.length} new insights.`,
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

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end space-y-3 z-40">
        {/* Secondary FAB - Create Manual Insight */}
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="lg"
          variant="secondary"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Primary FAB - Generate AI Insights */}
        <Button
          onClick={handleGenerateInsights}
          disabled={generating || (documentCount === 0 && !hasInsights)}
          size="lg"
          className="h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 bg-primary relative group"
        >
          {generating ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-7 w-7" />
              {documentCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-background text-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-primary">
                  {documentCount}
                </span>
              )}
            </>
          )}
        </Button>

        {/* Tooltip on hover */}
        {!generating && (
          <div className="absolute right-20 bottom-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-foreground text-background px-3 py-2 rounded-md text-sm">
            {documentCount > 0
              ? `Analyze ${documentCount} document${documentCount === 1 ? '' : 's'}`
              : 'Generate AI Insights'}
          </div>
        )}
      </div>

      {/* Dialogs and Overlays */}
      {showCreateDialog && (
        <CreateInsightDialog
          workspaceId={workspaceId}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            router.refresh();
          }}
        />
      )}

      {generating && <InsightGenerationOverlay documentCount={documentCount} />}
    </>
  );
}
