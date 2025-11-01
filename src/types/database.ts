// Database types generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type InsightStatus = 'new' | 'viewed' | 'dismissed' | 'archived';
export type InsightType = 'pattern' | 'contradiction' | 'suggestion' | 'reminder' | 'trend';
export type RelationshipType = 'semantic' | 'citation' | 'temporal' | 'entity';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          settings?: Json;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          settings?: Json;
        };
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          settings: Json;
          health_score: number;
          document_count: number;
          total_size_bytes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          settings?: Json;
        };
        Update: {
          name?: string;
          description?: string | null;
          settings?: Json;
        };
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          title: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          content: string | null;
          metadata: Json;
          status: DocumentStatus;
          upload_date: string;
          processed_at: string | null;
          last_accessed: string | null;
          access_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          title: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          content?: string | null;
          metadata?: Json;
          status?: DocumentStatus;
        };
        Update: {
          title?: string;
          content?: string | null;
          metadata?: Json;
          status?: DocumentStatus;
          processed_at?: string | null;
          last_accessed?: string | null;
          access_count?: number;
        };
      };
      chunks: {
        Row: {
          id: string;
          document_id: string;
          content: string;
          embedding: number[] | null;
          position: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          content: string;
          embedding?: number[] | null;
          position: number;
          metadata?: Json;
        };
      };
      memories: {
        Row: {
          id: string;
          workspace_id: string;
          content: string;
          embedding: number[] | null;
          confidence: number;
          sources: Json;
          metadata: Json;
          created_at: string;
          last_accessed: string;
          access_count: number;
          relevance_score: number;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          content: string;
          embedding?: number[] | null;
          confidence?: number;
          sources?: Json;
          metadata?: Json;
        };
      };
      relationships: {
        Row: {
          id: string;
          workspace_id: string;
          source_id: string;
          target_id: string;
          source_type: string;
          target_type: string;
          relationship_type: RelationshipType;
          strength: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          source_id: string;
          target_id: string;
          source_type: string;
          target_type: string;
          relationship_type: RelationshipType;
          strength?: number;
          metadata?: Json;
        };
      };
      tags: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          auto_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          auto_generated?: boolean;
        };
      };
      insights: {
        Row: {
          id: string;
          workspace_id: string;
          type: InsightType;
          title: string;
          content: string;
          related_documents: Json;
          status: InsightStatus;
          priority: number;
          metadata: Json;
          created_at: string;
          viewed_at: string | null;
          dismissed_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: InsightType;
          title: string;
          content: string;
          related_documents?: Json;
          status?: InsightStatus;
          priority?: number;
          metadata?: Json;
        };
        Update: {
          status?: InsightStatus;
          viewed_at?: string | null;
          dismissed_at?: string | null;
        };
      };
      collections: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          auto_generated: boolean;
          query: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          auto_generated?: boolean;
          query?: Json | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          workspace_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
      };
    };
  };
}
