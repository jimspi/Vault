'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Lightbulb, TrendingUp, AlertCircle, Clock, Sparkles, Plus, X } from 'lucide-react';
import { InsightType } from '@/types';

interface CreateInsightDialogProps {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const insightTypeOptions: { value: InsightType; label: string; icon: typeof Lightbulb }[] = [
  { value: 'pattern', label: 'Pattern', icon: TrendingUp },
  { value: 'contradiction', label: 'Contradiction', icon: AlertCircle },
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb },
  { value: 'reminder', label: 'Reminder', icon: Clock },
  { value: 'trend', label: 'Trend', icon: Sparkles },
];

export default function CreateInsightDialog({ workspaceId, onClose, onSuccess }: CreateInsightDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<InsightType>('suggestion');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/insights/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          title: title.trim(),
          content: content.trim(),
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create insight');
      }

      toast({
        title: 'Insight Created',
        description: 'Your insight has been saved successfully',
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create insight. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create Manual Insight</span>
              </CardTitle>
              <CardDescription>
                Add your own insights, observations, or reminders
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-3">
              <Label>Insight Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {insightTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Key theme across research papers"
                maxLength={200}
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your insight in detail..."
                className="w-full min-h-[150px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                maxLength={2000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {content.length}/2000 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Insight'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
