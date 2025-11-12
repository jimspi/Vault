'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RecommendationsCTAProps {
  workspaceId: string;
  hasRecommendations: boolean;
}

export default function RecommendationsCTA({ workspaceId, hasRecommendations }: RecommendationsCTAProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Don't show if user already has recommendations
  if (hasRecommendations) {
    return null;
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.count > 0) {
          toast({
            title: 'Recommendations generated!',
            description: `Created ${data.count} actionable recommendations based on your content${data.errors ? `. ${data.errors.length} failed to save.` : ''}`,
          });
          router.refresh();
        } else {
          toast({
            title: 'No recommendations created',
            description: 'The AI was unable to generate recommendations. Please check server logs for details.',
            variant: 'destructive',
          });
        }
      } else {
        console.error('[RecommendationsCTA] Error response:', data);
        const errorMessage = data.message || data.error || 'Failed to generate recommendations';
        const details = data.details ? ` (${data.details})` : '';
        throw new Error(errorMessage + details);
      }
    } catch (error) {
      console.error('[RecommendationsCTA] Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Could not generate recommendations',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border-primary/30 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/20 p-3 rounded-lg">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Ready for Actionable Recommendations?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Let AI analyze your insights and provide personalized, actionable recommendations tailored to your goals.
                Get specific steps, resources, and strategies based on what matters most to you.
              </p>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>AI will research real resources and events in your area</span>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={generating}
            className="ml-4"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Get Recommendations
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
