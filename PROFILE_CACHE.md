# Profile Cache System

## Overview

The AI Profile Summary feature includes intelligent caching to prevent API abuse and reduce costs while maintaining a fresh, up-to-date user experience.

## How It Works

### 24-Hour Cache
- Profile is cached in the database after generation
- Cache is valid for **24 hours** from last update
- Users can view their profile unlimited times (uses cached version)
- No API calls or AI costs for cached responses

### Cache Behavior

1. **First Request**
   - No cache exists
   - Generates profile using AI
   - Saves to cache
   - Returns fresh profile

2. **Subsequent Requests (within 24 hours)**
   - Returns cached profile immediately
   - No AI generation
   - Instant response
   - Shows cache age in metadata

3. **After 24 Hours**
   - Cache expires
   - Next request triggers new generation
   - Updates cache with fresh data
   - Returns new profile

### Empty Profiles
- Even empty profiles (no documents/insights) are cached
- Prevents repeated AI calls when workspace is empty
- Users see helpful "get started" message
- Cache still respects 24-hour limit

## Benefits

### For Users
- ✅ Unlimited profile views without rate limits
- ✅ Instant loading (cached responses)
- ✅ Always reasonably fresh (24-hour max age)
- ✅ No frustrating refresh restrictions

### For System
- ✅ Prevents API abuse
- ✅ Reduces AI costs dramatically
- ✅ Lower server load
- ✅ Better performance

## Cache Metadata

When profile is returned, metadata includes:

```json
{
  "profile": { ... },
  "metadata": {
    "documentCount": 5,
    "manualInsightCount": 3,
    "lastUpdated": "2024-01-15T10:30:00Z",
    "cached": true,
    "cacheAge": 120,  // minutes
    "nextRefresh": "2024-01-16T10:30:00Z"
  }
}
```

## Database Schema

```sql
CREATE TABLE profile_cache (
  id UUID PRIMARY KEY,
  workspace_id UUID UNIQUE REFERENCES workspaces(id),
  profile_data JSONB NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Future Enhancements

Possible improvements:
- Manual "Refresh Profile" button (with cooldown)
- Auto-invalidate cache when new documents uploaded
- Different cache durations based on activity level
- Admin override for cache duration
