# FileVault360 API Reference

Base URL: `http://localhost:3001` (development)

All authenticated endpoints require: `Authorization: Bearer <accessToken>`

---

## Authentication

### POST /auth/login
Login or auto-register a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### POST /auth/logout
Invalidate the current token. 🔒 **Requires auth.**

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

## Health

### GET /health
Returns service health status. No auth required.

**Response 200:**
```json
{
  "status": "ok",
  "service": "FileVault360 API",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Files 🔒 (All require auth)

### POST /files/upload
Upload a file to Azure Blob Storage.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | File to upload (max 50MB) |
| `description` | string | ❌ | File description |
| `tags` | string | ❌ | Comma-separated tags |

**Allowed MIME types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`, `text/csv`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/zip`

**Response 201:**
```json
{
  "file": {
    "id": "uuid",
    "userId": "uuid",
    "name": "document.pdf",
    "originalName": "My Document.pdf",
    "contentType": "application/pdf",
    "size": 102400,
    "blobUrl": "https://...",
    "containerName": "filevault360-files",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "tags": ["tag1", "tag2"],
    "description": "My file",
    "isShared": false
  },
  "message": "File uploaded successfully"
}
```

### GET /files
List all files for the authenticated user.

**Response 200:**
```json
{
  "data": [ /* FileMetadata[] */ ],
  "total": 5,
  "page": 1,
  "limit": 100
}
```

### GET /files/:id
Get metadata for a specific file.

**Response 200:** `FileMetadata` object  
**Response 404:** File not found

### PUT /files/:id
Update file metadata.

**Request Body:**
```json
{
  "name": "new-name.pdf",
  "description": "Updated description",
  "tags": ["tag1", "tag2"]
}
```

**Response 200:** Updated `FileMetadata` object

### DELETE /files/:id
Delete a file from Blob Storage and Cosmos DB.

**Response 200:**
```json
{ "message": "File deleted successfully" }
```

### GET /files/:id/download
Generate a short-lived SAS download URL (5 minutes).

**Response 200:**
```json
{
  "downloadUrl": "https://storage.azure.com/...?sv=...&se=...&sig=...",
  "expiresIn": 300
}
```

---

## Shared Files 🔒 (All require auth)

### POST /shared-files/upload
Upload a file to Azure File Share (accessible to all users).

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `file` | File | ✅ |

**Response 201:**
```json
{
  "file": {
    "id": "uuid",
    "userId": "uuid",
    "name": "document.pdf",
    "shareName": "shared-documents",
    "filePath": "documents/document.pdf",
    "contentType": "application/pdf",
    "size": 102400,
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Shared file uploaded successfully"
}
```

### GET /shared-files
List all shared files.

**Response 200:**
```json
{
  "data": [ /* SharedFile[] */ ],
  "total": 3,
  "page": 1,
  "limit": 100
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "ErrorCode",
  "message": "Human-readable message",
  "statusCode": 400
}
```

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | `BadRequest` | Missing/invalid parameters |
| 401 | `Unauthorized` | Missing, invalid, or revoked token |
| 404 | `NotFound` | Resource not found |
| 429 | `TooManyRequests` | Rate limit exceeded (100 req/15min) |
| 500 | `InternalServerError` | Unexpected server error |
