'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface CompactDocumentsProps {
  workspaceId: string;
  documents: Document[];
  onDocumentDeleted?: (documentId: string) => void;
}

export default function CompactDocuments({
  workspaceId: _workspaceId,
  documents,
  onDocumentDeleted
}: CompactDocumentsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast({
        title: 'Document deleted',
        description: 'Document removed from your vault',
      });

      if (onDocumentDeleted) {
        onDocumentDeleted(documentId);
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete document',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="border-b pb-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-3 hover:bg-muted rounded-md transition-colors"
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Documents ({documents.length})</span>
        </div>
      </button>

      {/* Document List */}
      {isExpanded && (
        <div className="mt-2 space-y-1">
          {documents.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">
              No documents yet
            </p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id}>
                {/* Document Row */}
                <div
                  className="group flex items-center justify-between px-3 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                  onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(doc.upload_date)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    onClick={(e) => handleDelete(doc.id, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>

                {/* Expanded Content Preview */}
                {expandedDoc === doc.id && doc.content && (
                  <div className="mx-3 mb-2 p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Preview</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setExpandedDoc(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-6">
                      {doc.content}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
