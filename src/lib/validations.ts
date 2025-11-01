import { z } from 'zod';

export const documentUploadSchema = z.object({
  workspaceId: z.string().uuid(),
  file: z.custom<File>(),
});

export const searchSchema = z.object({
  workspaceId: z.string().uuid(),
  query: z.string().min(1).max(1000),
  limit: z.number().min(1).max(100).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
  filters: z
    .object({
      fileTypes: z.array(z.string()).optional(),
      tags: z.array(z.string().uuid()).optional(),
      dateRange: z
        .object({
          start: z.string().datetime(),
          end: z.string().datetime(),
        })
        .optional(),
    })
    .optional(),
});

export const askSchema = z.object({
  workspaceId: z.string().uuid(),
  question: z.string().min(1).max(1000),
  context: z.array(z.string().uuid()).optional(),
});

export const workspaceCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z
    .object({
      privacy: z.enum(['private', 'shared']).optional(),
      retentionDays: z.number().nullable().optional(),
      autoTag: z.boolean().optional(),
      autoInsights: z.boolean().optional(),
    })
    .optional(),
});

export const tagCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const collectionCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});

export const insightUpdateSchema = z.object({
  status: z.enum(['new', 'viewed', 'dismissed', 'archived']),
});
