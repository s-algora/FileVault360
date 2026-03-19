# FileVault360 – Architecture Overview

## System Overview

FileVault360 is a cloud-native file management system built on Microsoft Azure. It provides secure file upload, storage, sharing, and management capabilities through a modern web interface backed by a RESTful API.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Frontend (React + Vite)                        │
│              Port 5173 (dev) / 80 (prod)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
┌────────────────────────▼────────────────────────────────────┐
│              API Server (Express + TypeScript)              │
│              Port 3001                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐   │
│  │  /auth   │ │  /files  │ │     /shared-files        │   │
│  └──────────┘ └──────────┘ └──────────────────────────┘   │
└──────┬─────────────┬───────────────┬────────────────────────┘
       │             │               │
┌──────▼──┐   ┌──────▼──┐    ┌──────▼──────────────────────┐
│  Redis  │   │ Cosmos  │    │    Azure Storage             │
│  Cache  │   │   DB    │    │  ┌──────────┐ ┌──────────┐  │
│         │   │         │    │  │   Blob   │ │  Queue   │  │
└─────────┘   └─────────┘    │  └──────────┘ └──────────┘  │
                              │  ┌──────────────────────┐   │
                              │  │     File Share        │   │
                              │  └──────────────────────┘   │
                              └─────────────────────────────┘
                                           │
                              ┌────────────▼────────────────┐
                              │   Background Worker         │
                              │   (Queue Consumer)          │
                              └─────────────────────────────┘
```

## Components

### Frontend (apps/frontend)
- **Framework**: React 18 + Vite + TypeScript
- **State**: Zustand (auth), TanStack Query (server state)
- **Routing**: React Router v6
- **UI**: Custom CSS-in-JS with inline styles
- **Features**: File upload (drag-and-drop), file management, shared files

### API Server (apps/api)
- **Runtime**: Node.js 20 + Express 4 + TypeScript
- **Auth**: JWT with Redis-backed token blacklisting
- **File uploads**: Multer (memory storage) → Azure Blob Storage
- **Rate limiting**: express-rate-limit (100 req/15min)
- **Security**: Helmet, CORS, bcrypt password hashing

### Background Worker (apps/worker)
- **Runtime**: Node.js 20 + TypeScript
- **Queue**: Azure Storage Queue (long-polling, 5s interval)
- **Handlers**: FILE_UPLOADED, FILE_DELETED, FILE_SHARED
- **Extensible**: virus scanning, thumbnail generation, notifications

### Shared Packages
| Package | Purpose |
|---------|---------|
| `@filevault360/shared-types` | TypeScript interfaces shared across all apps |
| `@filevault360/shared-utils` | Utility functions (generateId, sanitizeFileName, etc.) |
| `@filevault360/config` | Centralized config loader with Key Vault support |

## Azure Services

| Service | Purpose |
|---------|---------|
| **Azure Cosmos DB** (NoSQL, Serverless) | User records, file metadata, shared file records |
| **Azure Blob Storage** | Private binary file storage with SAS URL generation |
| **Azure Storage Queue** | Async messaging between API and Worker |
| **Azure File Share** | SMB-accessible shared document storage |
| **Azure Redis Cache** | JWT blacklisting, response caching, session management |
| **Azure Key Vault** | Secrets management (Cosmos key, Storage connection string) |

## Data Flow

### File Upload
1. User selects file via drag-and-drop UI
2. Frontend sends `multipart/form-data` POST to `/files/upload`
3. API validates JWT, applies rate limiting
4. Multer buffers file in memory
5. API uploads buffer to Azure Blob Storage
6. API saves `FileMetadata` document to Cosmos DB
7. API enqueues `FILE_UPLOADED` message to Azure Storage Queue
8. API invalidates Redis cache for user's file list
9. Worker dequeues and processes message (virus scan stub, etc.)

### Authentication
1. User submits email/password
2. API checks Cosmos DB for user record
3. If first login, creates user with bcrypt-hashed password
4. Issues JWT (1h expiry) signed with `JWT_SECRET`
5. Token stored in Zustand persist (localStorage)
6. On logout, token added to Redis blacklist (`blacklist:<token>`)

## Security Considerations
- All routes (except `/auth/login` and `/health`) require Bearer token
- Tokens validated against Redis blacklist on every request
- File uploads limited to 50MB, allowlisted MIME types only
- CORS restricted to configured origin
- Helmet sets security headers
- Cosmos DB keys stored in Azure Key Vault in production
- SAS URLs expire in 5 minutes (download) or 60 minutes (default)
