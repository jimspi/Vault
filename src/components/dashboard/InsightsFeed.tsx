'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { Insight } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface InsightsFeedProps {
  workspaceId: string;
  initialInsights: Insight[];
}

const insightIcons = {
  pattern: TrendingUp,
  contradiction: AlertCircle,
  suggestion: Lightbulb,
  reminder: Clock,
  trend: Sparkles,
};

export default function InsightsFeed({ workspaceId: _workspaceId, initialInsights }: InsightsFeedProps) {
  if (initialInsights.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Upload more documents to enable AI-powered insights. We'll automatically detect
            patterns, contradictions, and trends across your content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {initialInsights.map((insight) => {
        const Icon = insightIcons[insight.type];

        return (
          <Card key={insight.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(insight.created_at)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-4">
                {insight.content}
              </CardDescription>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  View Related Documents
                </Button>
                <Button size="sm" variant="ghost">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
