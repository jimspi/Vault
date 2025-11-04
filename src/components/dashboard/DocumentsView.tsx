'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Trash2, Search, Calendar, Sparkles } from 'lucide-react';
import { formatBytes, formatRelativeTime } from '@/lib/utils';
import { Document } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface DocumentsViewProps {
  workspaceId: string;
  initialDocuments: Document[];
}

export default function DocumentsView({ workspaceId, initialDocuments }: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateInsights = async () => {
    // Note: AI can work with just manual insights too, but in Documents tab,
    // it makes sense to have documents. User can use main dashboard if they
    // want to generate from insights alone.
    if (documents.length === 0) {
      toast({
        title: 'No Documents Yet',
        description: 'Upload documents here, or go to the main dashboard to generate insights from manual insights only.',
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

      setGenerating(false);
      toast({
        title: 'Insights Generated!',
        description: `Created ${data.insights.length} new insights. Check the Insights tab to view them.`,
      });
      router.refresh();
    } catch (error) {
      setGenerating(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate insights',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

      toast({
        title: 'Document deleted',
        description: 'The document has been removed from your vault',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the document',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleGenerateInsights}
          disabled={generating || documents.length === 0}
          className="whitespace-nowrap"
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
      </div>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-sm text-muted-foreground text-center">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Upload your first document to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold truncate">{document.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {document.file_name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(document.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatRelativeTime(document.upload_date)}</span>
                  </div>
                  <div>
                    <span className="font-medium">{formatBytes(document.file_size)}</span>
                  </div>
                  {document.status === 'processing' && (
                    <div className="text-primary">Processing...</div>
                  )}
                  {document.status === 'failed' && (
                    <div className="text-destructive">Processing failed</div>
                  )}
                </div>

                {document.content && (
                  <p className="mt-3 text-sm line-clamp-3 text-muted-foreground">
                    {document.content}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
