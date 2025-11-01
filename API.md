# Vault API Documentation

## Overview

The Vault API provides endpoints for document management, semantic search, and AI-powered insights.

**Base URL**: `https://your-domain.com/api`

**Authentication**: Cookie-based session authentication via Supabase Auth

## Authentication

All API endpoints require authentication. Users must be logged in with a valid session.

### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

### Sign In
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Sign Out
```http
POST /auth/signout
```

## Documents

### Upload Document

Upload a new document to your workspace.

**Endpoint**: `POST /api/documents/upload`

**Headers**:
- `Content-Type: multipart/form-data`

**Body**:
```
file: File (required)
workspaceId: string (required)
```

**Supported File Types**:
- PDF (.pdf)
- Word (.docx)
- Text (.txt)
- Markdown (.md)
- Images (.png, .jpg, .jpeg)

**File Size Limit**: 10MB

**Response**:
```json
{
  "documentId": "uuid",
  "status": "processing",
  "message": "Document upload successful. Processing in background."
}
```

**Example**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('workspaceId', 'workspace-uuid');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

### List Documents

Get all documents in a workspace.

**Endpoint**: `GET /api/documents`

**Query Parameters**:
- `workspaceId` (required): string - Workspace ID
- `limit` (optional): number - Number of documents to return (default: 50, max: 100)
- `offset` (optional): number - Offset for pagination (default: 0)

**Response**:
```json
{
  "documents": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "user_id": "uuid",
      "title": "Document Title",
      "file_name": "document.pdf",
      "file_type": "application/pdf",
      "file_size": 1024000,
      "storage_path": "path/to/file",
      "content": "Extracted text content...",
      "metadata": {},
      "status": "ready",
      "upload_date": "2024-01-01T00:00:00Z",
      "processed_at": "2024-01-01T00:01:00Z",
      "tags": [
        {
          "id": "uuid",
          "name": "AI",
          "color": "#6366f1"
        }
      ]
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### Delete Document

Delete a document and all associated data.

**Endpoint**: `DELETE /api/documents`

**Query Parameters**:
- `id` (required): string - Document ID

**Response**:
```json
{
  "success": true
}
```

**Example**:
```javascript
await fetch(`/api/documents?id=${documentId}`, {
  method: 'DELETE',
});
```

## Search

### Semantic Search

Search across all documents using semantic similarity.

**Endpoint**: `POST /api/search`

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "workspaceId": "uuid",
  "query": "search query",
  "limit": 10,
  "threshold": 0.7,
  "filters": {
    "fileTypes": ["application/pdf"],
    "tags": ["uuid1", "uuid2"],
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    }
  }
}
```

**Parameters**:
- `workspaceId` (required): Workspace to search in
- `query` (required): Search query (1-1000 characters)
- `limit` (optional): Max results (1-100, default: 10)
- `threshold` (optional): Similarity threshold (0-1, default: 0.7)
- `filters` (optional): Additional filters

**Response**:
```json
{
  "results": [
    {
      "id": "chunk-uuid",
      "documentId": "doc-uuid",
      "content": "Matching text chunk...",
      "similarity": 0.85,
      "document": {
        "id": "doc-uuid",
        "title": "Document Title",
        "fileName": "file.pdf",
        "uploadDate": "2024-01-01T00:00:00Z"
      }
    }
  ],
  "total": 5,
  "query": "search query"
}
```

**Example**:
```javascript
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspaceId: 'workspace-uuid',
    query: 'artificial intelligence applications',
    limit: 10,
  }),
});

const data = await response.json();
```

## AI Features

### Ask Question

Get AI-powered answers with source citations.

**Endpoint**: `POST /api/ask`

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "workspaceId": "uuid",
  "question": "What are the main points discussed?",
  "context": ["doc-uuid1", "doc-uuid2"]
}
```

**Parameters**:
- `workspaceId` (required): Workspace to query
- `question` (required): Question to answer (1-1000 characters)
- `context` (optional): Specific document IDs to use for context

**Response**:
```json
{
  "answer": "Based on the documents, the main points are...",
  "sources": [
    {
      "documentId": "uuid",
      "title": "Document Title",
      "excerpt": "Relevant excerpt...",
      "relevance": 0.92
    }
  ],
  "confidence": 0.85
}
```

**Example**:
```javascript
const response = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspaceId: 'workspace-uuid',
    question: 'What is the primary focus of these documents?',
  }),
});

const data = await response.json();
```

### Generate Insights

Generate AI insights for a workspace (admin only).

**Endpoint**: `POST /api/insights/generate`

**Body**:
```json
{
  "workspaceId": "uuid",
  "types": ["pattern", "contradiction", "trend"]
}
```

**Response**:
```json
{
  "insights": [
    {
      "id": "uuid",
      "type": "pattern",
      "title": "Recurring Theme: AI Ethics",
      "content": "Analysis shows consistent discussion of AI ethics across 15 documents...",
      "relatedDocuments": ["uuid1", "uuid2"],
      "priority": 3
    }
  ]
}
```

## Workspaces

### Create Workspace

**Endpoint**: `POST /api/workspaces`

**Body**:
```json
{
  "name": "My Research",
  "description": "Collection of research papers"
}
```

### Update Workspace

**Endpoint**: `PATCH /api/workspaces/:id`

**Body**:
```json
{
  "name": "Updated Name",
  "settings": {
    "autoTag": true,
    "autoInsights": true
  }
}
```

## Tags

### Create Tag

**Endpoint**: `POST /api/tags`

**Body**:
```json
{
  "workspaceId": "uuid",
  "name": "AI Research",
  "color": "#6366f1"
}
```

### Add Tag to Document

**Endpoint**: `POST /api/documents/:id/tags`

**Body**:
```json
{
  "tagId": "uuid"
}
```

## Rate Limits

- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **Upload**: 5 files/minute
- **Search**: 20 requests/minute

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Status Codes**:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Webhooks (Coming Soon)

Subscribe to events:
- `document.uploaded`
- `document.processed`
- `insight.created`
- `workspace.updated`

## SDKs (Coming Soon)

Official SDKs:
- JavaScript/TypeScript
- Python
- Go

## Support

- GitHub Issues: [your-repo/issues]
- Email: api@vault.ai
- Documentation: [docs.vault.ai]

---

**Version**: 1.0.0
**Last Updated**: 2024-01-01
