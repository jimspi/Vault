'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertCircle, Sparkles, Clock, FileText, Trash2, X } from 'lucide-react';
import { Insight, Document } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import EmailInsightButton from './EmailInsightButton';

interface EnhancedInsightsFeedProps {
  workspaceId: string;
  insights: Insight[];
  documents: Document[];
  onDocumentClick?: (documentId: string) => void;
}

const insightIcons = {
  pattern: TrendingUp,
  contradiction: AlertCircle,
  suggestion: Lightbulb,
  reminder: Clock,
  trend: Sparkles,
};

const insightColors = {
  pattern: 'bg-blue-500/10 text-blue-700 border-blue-200',
  contradiction: 'bg-red-500/10 text-red-700 border-red-200',
  suggestion: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  reminder: 'bg-purple-500/10 text-purple-700 border-purple-200',
  trend: 'bg-green-500/10 text-green-700 border-green-200',
};

export default function EnhancedInsightsFeed({
  workspaceId: _workspaceId,
  insights,
  documents,
  onDocumentClick,
}: EnhancedInsightsFeedProps) {
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Create document ID to title mapping
  const docMap = new Map(documents.map(d => [d.id, d.title]));

  const toggleSelection = (insightId: string) => {
    const newSelection = new Set(selectedInsights);
    if (newSelection.has(insightId)) {
      newSelection.delete(insightId);
    } else {
      newSelection.add(insightId);
    }
    setSelectedInsights(newSelection);
  };

  const clearSelection = () => {
    setSelectedInsights(new Set());
  };

  const handleDelete = async (insightId: string) => {
    if (!confirm('Delete this insight?')) {
      return;
    }

    setDeletingId(insightId);

    try {
      const response = await fetch(`/api/insights/${insightId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast({
        title: 'Insight deleted',
        description: 'Insight removed from your vault',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete insight',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDismiss = async (insightId: string) => {
    try {
      const response = await fetch(`/api/insights/${insightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss');
      }

      toast({
        title: 'Insight dismissed',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Dismiss failed',
        variant: 'destructive',
      });
    }
  };

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="relative">
          <Lightbulb className="h-24 w-24 text-muted-foreground/20" />
          <Sparkles className="h-12 w-12 text-primary absolute -top-2 -right-2 animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold mt-6 mb-3">No Insights Yet</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Upload documents or create manual insights to get started. Then let AI discover patterns and connections.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" size="lg">
            <Lightbulb className="h-5 w-5 mr-2" />
            Create Manual Insight
          </Button>
          <Button size="lg">
            <Sparkles className="h-5 w-5 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>
    );
  }

  const selectedArray = Array.from(selectedInsights);
  const hasSelection = selectedArray.length > 0;

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {hasSelection && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <span className="text-sm font-medium">
                  {selectedArray.length} insight{selectedArray.length === 1 ? '' : 's'} selected
                </span>
              </div>
              <EmailInsightButton
                insightIds={selectedArray}
                variant="bulk"
                size="default"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights List */}
      {insights.map((insight) => {
        const Icon = insightIcons[insight.type];
        const isManual = (insight.metadata as any)?.source === 'manual';
        const isAI = (insight.metadata as any)?.source === 'ai_generated';
        const relatedDocIds = (insight.related_documents as string[]) || [];
        const relatedDocs = relatedDocIds.map(id => ({
          id,
          title: docMap.get(id) || 'Unknown Document'
        })).filter(d => d.title !== 'Unknown Document');

        const isSelected = selectedInsights.has(insight.id);
        const isDeleting = deletingId === insight.id;

        return (
          <Card
            key={insight.id}
            className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${isDeleting ? 'opacity-50' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* Checkbox for selection */}
                  {isAI && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(insight.id)}
                      className="mt-1"
                    />
                  )}

                  {/* Icon */}
                  <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={insightColors[insight.type]}
                      >
                        {insight.type.toUpperCase()}
                      </Badge>

                      {isAI && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">
                          AI Generated
                        </Badge>
                      )}

                      {isManual && (
                        <Badge variant="outline">
                          Manual
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2 leading-tight">
                      {insight.title}
                    </h3>

                    {/* Content */}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {insight.content}
                    </p>

                    {/* Document Sources */}
                    {relatedDocs.length > 0 && (
                      <div className="flex items-start space-x-2 mt-3 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                        <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium">Based on: </span>
                          {relatedDocs.map((doc, index) => (
                            <span key={doc.id}>
                              <button
                                onClick={() => onDocumentClick?.(doc.id)}
                                className="underline hover:text-primary transition-colors"
                              >
                                {doc.title}
                              </button>
                              {index < relatedDocs.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(insight.created_at)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {/* Email button for AI insights */}
                {isAI && !isSelected && (
                  <EmailInsightButton
                    insightIds={[insight.id]}
                    variant="single"
                  />
                )}

                {/* Dismiss button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDismiss(insight.id)}
                  disabled={isDeleting}
                >
                  Dismiss
                </Button>

                {/* Delete button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(insight.id)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
