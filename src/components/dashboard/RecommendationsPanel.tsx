'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  TrendingUp,
  BookOpen,
  Users,
  Briefcase,
  DollarSign,
  Heart,
  CheckCircle2,
  Circle,
  PlayCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ActionItem {
  step: string;
  timeframe: string;
}

interface Resource {
  title: string;
  url: string;
  description: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  action_items: ActionItem[];
  resources: Resource[];
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'completed' | 'dismissed';
  created_at: string;
}

interface RecommendationsPanelProps {
  workspaceId: string;
}

const categoryIcons: Record<string, any> = {
  networking: Users,
  learning: BookOpen,
  productivity: TrendingUp,
  health: Heart,
  career: Briefcase,
  finance: DollarSign,
  personal: Target,
};

const priorityColors = {
  low: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20',
  medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
};

const statusIcons = {
  new: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
  dismissed: XCircle,
};

export default function RecommendationsPanel({ workspaceId }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'completed' | 'dismissed'>('all');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchRecommendations();
  }, [workspaceId, filter]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/recommendations?workspaceId=${workspaceId}&status=${filter}`);
      const data = await response.json();

      if (response.ok) {
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Recommendations generated!',
          description: `Created ${data.count} actionable recommendations based on your content`,
        });
        fetchRecommendations();
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Could not generate recommendations',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: Recommendation['status']) => {
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: 'Updated',
          description: `Recommendation marked as ${status.replace('_', ' ')}`,
        });
        fetchRecommendations();
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0 && !generating) {
    return (
      <div className="p-6">
        <Card className="bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/20">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <Lightbulb className="h-16 w-16 text-primary mx-auto" />
              <h3 className="text-xl font-bold">Get Actionable Recommendations</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let AI analyze your documents and insights to provide personalized, actionable recommendations
                tailored to your goals and interests.
              </p>
              <Button
                size="lg"
                onClick={generateRecommendations}
                disabled={generating}
                className="mt-4"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5 mr-2" />
                    Generate Recommendations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredRecommendations = filter === 'all'
    ? recommendations
    : recommendations.filter(r => r.status === filter);

  return (
    <div className="p-6 space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Actionable Recommendations</h2>
        <div className="flex items-center space-x-2">
          {(['all', 'new', 'in_progress', 'completed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={generateRecommendations}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </div>

      {/* Recommendations list */}
      <div className="space-y-4">
        {filteredRecommendations.map((rec) => {
          const CategoryIcon = categoryIcons[rec.category] || Target;
          const StatusIcon = statusIcons[rec.status];

          return (
            <Card key={rec.id} className="border-l-4" style={{
              borderLeftColor: rec.priority === 'high' || rec.priority === 'urgent' ? '#f97316' : '#3b82f6'
            }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="outline" className={priorityColors[rec.priority]}>
                      {rec.priority}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {rec.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reasoning */}
                {rec.reasoning && (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm italic text-muted-foreground">{rec.reasoning}</p>
                  </div>
                )}

                {/* Action Items */}
                {rec.action_items && rec.action_items.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Action Steps
                    </h4>
                    <ul className="space-y-2">
                      {rec.action_items.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-sm">
                          <span className="text-primary font-medium mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                            <span>{item.step}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.timeframe}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Resources */}
                {rec.resources && rec.resources.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                      Resources
                    </h4>
                    <div className="space-y-2">
                      {rec.resources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-primary">{resource.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  {rec.status !== 'in_progress' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(rec.id, 'in_progress')}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {rec.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(rec.id, 'completed')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  {rec.status !== 'dismissed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(rec.id, 'dismissed')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
