# Vercel Blob + MongoDB Resources Implementation

## Overview

This implementation provides a complete image upload system using Vercel Blob for storage and MongoDB for metadata management. It follows the specified pattern with client-side upload and server-side resource registration.

## Architecture

### Components

1. **MongoDB Resources Collection** (`src/lib/resources.ts`)
   - Manages the `recursos` collection with idempotent indexes
   - Provides CRUD operations for resources
   - Tracks usage with `refCount` for reference counting

2. **Upload Route Handler** (`src/app/api/blob/upload/route.ts`)
   - Uses `handleUpload` from `@vercel/blob/client`
   - Implements `onBeforeGenerateToken` with content type and size restrictions
   - Implements `onUploadCompleted` for automatic resource registration

3. **Fallback Registration** (`src/app/api/resources/register/route.ts`)
   - Manual resource registration for local development
   - Handles cases where `onUploadCompleted` doesn't work locally

4. **Test Page** (`src/app/blob-test/page.jsx`)
   - Complete client-side upload interface
   - File selection, preview, progress tracking
   - Automatic fallback registration for local development

5. **Auxiliary Endpoints**
   - `GET /api/resources/top` - List top resources by usage
   - `GET /api/resources/[id]` - Get resource details
   - `DELETE /api/resources/[id]` - Delete resource (protected)

## Database Schema

### Resources Collection (`recursos`)

```typescript
interface Recurso {
  _id?: ObjectId;
  provider: "vercel-blob";
  url: string;                    // Vercel Blob URL
  key?: string;                   // Blob pathname
  filename: string;               // Original filename
  mime: string;                   // MIME type
  sizeBytes: number;              // File size in bytes
  usage: { refCount: number };    // Reference count
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;              // Optional last usage tracking
  status?: "active" | "orphan";   // Resource status
}
```

### Indexes

- `{ "usage.refCount": -1, "updatedAt": -1 }` - For top resources query
- `{ "createdAt": -1 }` - For chronological listing
- `{ "url": 1 }` - Unique constraint to prevent duplicates
- `{ "provider": 1, "key": 1 }` - Alternative unique constraint

## API Endpoints

### Upload

**POST** `/api/blob/upload`

Handles file uploads with automatic resource registration.

**Features:**
- Content type validation (images only)
- Size limit: 10MB
- Random suffix generation
- Automatic MongoDB registration

### Resource Management

**POST** `/api/resources/register`

Manual resource registration (fallback for local development).

**Body:**
```json
{
  "url": "https://...",
  "key": "optional-key",
  "filename": "image.jpg",
  "mime": "image/jpeg",
  "sizeBytes": 12345
}
```

**GET** `/api/resources/top?limit=10`

Returns top resources by usage count.

**GET** `/api/resources/[id]`

Returns resource details by ID.

**DELETE** `/api/resources/[id]`

Deletes resource (only if `refCount === 0`).

## Usage

### Client-Side Upload

```javascript
import { upload } from "@vercel/blob/client";

const blob = await upload(file.name, file, {
  access: 'public',
  handleUploadUrl: '/api/blob/upload',
  clientPayload: JSON.stringify({ 
    originalFilename: file.name,
    timestamp: Date.now()
  }),
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress.percentage}%`);
  }
});
```

### Server-Side Resource Management

```javascript
import { upsertRecurso, getTopRecursos } from "@/lib/resources";

// Register a resource
const recurso = await upsertRecurso({
  provider: "vercel-blob",
  url: "https://...",
  filename: "image.jpg",
  mime: "image/jpeg",
  sizeBytes: 12345
});

// Get top resources
const topResources = await getTopRecursos(10);
```

## Environment Variables

Required environment variables:

- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - MongoDB database name

## Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Visit the test page:**
   ```
   http://localhost:3000/blob-test
   ```

3. **Test API endpoints:**
   ```bash
   # Test collection setup
   curl http://localhost:3000/api/resources/test
   
   # Get top resources
   curl http://localhost:3000/api/resources/top?limit=5
   ```

## Development Notes

- **Local Development:** The `onUploadCompleted` callback may not work in localhost. The fallback registration endpoint handles this automatically.
- **Production:** Resources are automatically registered via the `onUploadCompleted` callback.
- **Reference Counting:** The system is prepared for integration with questions/other entities that reference resources.
- **Error Handling:** All endpoints include comprehensive error handling and logging.

## Integration with Questions

The system is prepared for integration with the questions collection. When a question references a resource:

1. Increment `usage.refCount` when adding a reference
2. Decrement `usage.refCount` when removing a reference
3. Resources with `refCount > 0` cannot be deleted

Example integration:
```javascript
// When adding a resource to a question
await incrementResourceUsage(resourceId);

// When removing a resource from a question
await decrementResourceUsage(resourceId);
```

## Security Considerations

- File type validation (images only)
- Size limits (10MB max)
- Unique URL constraints prevent duplicates
- Protected deletion (only unused resources)
- Proper error handling and logging
