import { Database, InsightType, RelationshipType } from './database';

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Domain types
export type Profile = Tables<'profiles'>;
export type Workspace = Tables<'workspaces'>;
export type Document = Tables<'documents'>;
export type Chunk = Tables<'chunks'>;
export type Memory = Tables<'memories'>;
export type Relationship = Tables<'relationships'>;
export type Tag = Tables<'tags'>;
export type Insight = Tables<'insights'>;
export type Collection = Tables<'collections'>;
export type AuditLog = Tables<'audit_logs'>;

// Extended types with relations
export interface DocumentWithTags extends Document {
  tags: Tag[];
  chunk_count: number;
  related_count: number;
}

export interface DocumentWithRelations extends Document {
  tags: Tag[];
  chunks: Chunk[];
  relationships: Relationship[];
}

export interface WorkspaceWithStats extends Workspace {
  recent_documents: Document[];
  recent_insights: Insight[];
}

export interface MemoryWithSources extends Memory {
  source_documents: Document[];
}

// API Request/Response types
export interface UploadDocumentRequest {
  workspaceId: string;
  file: File;
}

export interface UploadDocumentResponse {
  documentId: string;
  status: 'uploading' | 'processing';
}

export interface SearchRequest {
  workspaceId: string;
  query: string;
  limit?: number;
  threshold?: number;
  filters?: {
    fileTypes?: string[];
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export interface SearchResult {
  id: string;
  documentId: string;
  content: string;
  similarity: number;
  document: {
    id: string;
    title: string;
    fileName: string;
    uploadDate: string;
  };
  highlights?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export interface AskRequest {
  workspaceId: string;
  question: string;
  context?: string[];
}

export interface AskResponse {
  answer: string;
  sources: {
    documentId: string;
    title: string;
    excerpt: string;
    relevance: number;
  }[];
  confidence: number;
}

export interface GenerateInsightsRequest {
  workspaceId: string;
  types?: InsightType[];
}

export interface ExtractMemoriesRequest {
  documentId: string;
}

export interface ExtractMemoriesResponse {
  memories: {
    content: string;
    confidence: number;
    metadata: Record<string, any>;
  }[];
  tags: string[];
}

// UI State types
export interface ViewMode {
  type: 'grid' | 'list' | 'timeline' | 'graph';
}

export interface FilterState {
  search: string;
  tags: string[];
  fileTypes: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sortBy: 'upload_date' | 'title' | 'file_size' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// Graph visualization types
export interface GraphNode {
  id: string;
  label: string;
  type: 'document' | 'memory' | 'tag';
  metadata: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Settings types
export interface WorkspaceSettings {
  privacy: 'private' | 'shared';
  retentionDays: number | null;
  autoTag: boolean;
  autoInsights: boolean;
  embeddingModel: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultView: ViewMode['type'];
  notifications: {
    email: boolean;
    insights: boolean;
    reminders: boolean;
  };
}

// Re-export database types
export * from './database';
