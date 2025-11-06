'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EnhancedInsightsFeed from './EnhancedInsightsFeed';
import InsightsSearchBar from './InsightsSearchBar';
import CompactDocuments from './CompactDocuments';
import CompactUpload from './CompactUpload';
import FloatingActionButtons from './FloatingActionButtons';
import ProfileSummary from './ProfileSummary';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Insight, Document } from '@/types';

interface DashboardLayoutProps {
  workspaceId: string;
  workspaceName: string;
  workspaceDescription?: string;
  insights: Insight[];
  documents: Document[];
  documentCount: number;
}

export default function DashboardLayout({
  workspaceId,
  workspaceName,
  workspaceDescription,
  insights,
  documents,
  documentCount,
}: DashboardLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const router = useRouter();

  // Filter insights based on search query and filter type
  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = insight.title.toLowerCase().includes(query);
        const matchesContent = insight.content.toLowerCase().includes(query);

        // Also search in related document titles
        const relatedDocIds = (insight.metadata as any)?.related_documents || [];
        const matchesDocument = relatedDocIds.some((docId: string) => {
          const doc = documents.find(d => d.id === docId);
          return doc?.title.toLowerCase().includes(query);
        });

        if (!matchesTitle && !matchesContent && !matchesDocument) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all') {
        // Handle AI/Manual filters
        if (filterType === 'ai') {
          return (insight.metadata as any)?.source === 'ai_generated';
        }
        if (filterType === 'manual') {
          return (insight.metadata as any)?.source === 'manual';
        }
        // Handle type filters
        if (insight.type !== filterType) {
          return false;
        }
      }

      return true;
    });
  }, [insights, searchQuery, filterType, documents]);

  const handleDocumentClick = (documentId: string) => {
    setSelectedDocumentId(documentId);
    // Scroll to document in sidebar
    const element = document.getElementById(`document-${documentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDocumentDeleted = () => {
    router.refresh();
  };

  return (
    <div className="flex h-screen">
      {/* Main Content Area - Insights */}
      <div className="flex-1 overflow-y-auto">
        {/* Workspace Header */}
        <div className="border-b bg-background p-4">
          <h1 className="text-2xl font-bold tracking-tight">{workspaceName}</h1>
          {workspaceDescription && (
            <p className="text-sm text-muted-foreground">{workspaceDescription}</p>
          )}
        </div>

        {/* AI Profile Summary - Not sticky, scrollable */}
        <div className="p-4 border-b bg-background">
          <ProfileSummary workspaceId={workspaceId} />
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-0 bg-background z-30 border-b p-4">
          <InsightsSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterChange={setFilterType}
            resultCount={filteredInsights.length}
          />
        </div>

        {/* Insights Feed */}
        <div className="p-6">
          <EnhancedInsightsFeed
            workspaceId={workspaceId}
            insights={filteredInsights}
            documents={documents}
            onDocumentClick={handleDocumentClick}
          />
        </div>
      </div>

      {/* Right Sidebar - Documents and Upload */}
      <div className="w-80 border-l bg-muted/20 overflow-y-auto">
        <div className="p-4 space-y-4">
          <CompactUpload workspaceId={workspaceId} />
          <CompactDocuments
            workspaceId={workspaceId}
            documents={documents}
            onDocumentDeleted={handleDocumentDeleted}
            highlightedDocId={selectedDocumentId}
          />

          {/* Settings Button */}
          <Link href="/dashboard/settings" className="block">
            <Button variant="outline" className="w-full" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        workspaceId={workspaceId}
        documentCount={documentCount}
        hasInsights={insights.length > 0}
      />
    </div>
  );
}
