# 🗄️ FileVault360

**Cloud-Native File Management System** – A production-ready monorepo built on Azure.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Azure](https://img.shields.io/badge/Azure-Native-0078d4)](https://azure.microsoft.com/)

---

## Overview

FileVault360 is a cloud-native file management platform providing:
- 🔐 **JWT authentication** with Redis-backed token revocation
- 📁 **Private file storage** via Azure Blob Storage with SAS download URLs
- 🔗 **Shared file storage** via Azure File Share (team-accessible)
- ⚡ **Background processing** via Azure Storage Queue worker
- 🗃️ **Metadata management** via Azure Cosmos DB (serverless)
- 🏎️ **Response caching** via Azure Redis Cache

---

## Monorepo Structure

```
filevault360/
├── apps/
│   ├── frontend/        React + Vite + TypeScript (port 5173)
│   ├── api/             Node.js + Express + TypeScript (port 3001)
│   └── worker/          Queue consumer (Azure Storage Queue)
├── packages/
│   ├── shared-types/    TypeScript interfaces shared across apps
│   ├── shared-utils/    Utility functions (generateId, formatFileSize, etc.)
│   └── config/          Azure config loader with Key Vault support
├── infra/
│   └── terraform/       Azure infrastructure as code
├── docker/              Dockerfiles + docker-compose
├── docs/
│   ├── architecture/    System design & data flow
│   ├── api/             REST API reference
│   └── runbooks/        Operational guides
└── postman/             Postman collection + environment
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 20
- Docker (for Redis)

### 1. Install
```bash
npm install
```

### 2. Start Redis
```bash
docker run -d --name fv360-redis -p 6379:6379 redis:7-alpine
```

### 3. Configure API
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env – minimum: PORT=3001, JWT_SECRET=any-secret, REDIS_HOST=localhost, REDIS_TLS=false
```

### 4. Build shared packages
```bash
npm run build --workspace=packages/shared-types
npm run build --workspace=packages/shared-utils
npm run build --workspace=packages/config
```

### 5. Run all services
```bash
npm run dev
```

Open **http://localhost:5173** → log in with any email/password.

### Docker Compose
```bash
cd docker && docker compose up --build
```
Frontend: http://localhost:80 | API: http://localhost:3001

---

## API Reference

See [docs/api/README.md](docs/api/README.md) for full endpoint documentation.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login / auto-register |
| POST | `/auth/logout` | Revoke token |
| GET | `/health` | Health check |
| POST | `/files/upload` | Upload file to Blob Storage |
| GET | `/files` | List your files |
| GET | `/files/:id` | Get file metadata |
| PUT | `/files/:id` | Update file metadata |
| DELETE | `/files/:id` | Delete file |
| GET | `/files/:id/download` | Get SAS download URL |
| POST | `/shared-files/upload` | Upload to File Share |
| GET | `/shared-files` | List shared files |

---

## Azure Infrastructure (Terraform)

```bash
cd infra/terraform
terraform init
terraform apply -var="environment=dev"
```

Provisions: Resource Group, Cosmos DB, Storage Account (Blob + Queue + File Share), Redis Cache, Key Vault.

See [docs/architecture/README.md](docs/architecture/README.md) for architecture details.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services concurrently |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all packages |

---

## Postman

Import `postman/FileVault360.postman_collection.json` and `postman/FileVault360.postman_environment.json` into Postman. The Login request automatically saves the token for subsequent requests.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript, Zustand, TanStack Query |
| API | Node.js 20, Express 4, TypeScript, Multer, JWT |
| Worker | Node.js 20, TypeScript, Azure Storage Queue SDK |
| Database | Azure Cosmos DB (NoSQL, Serverless) |
| Storage | Azure Blob Storage, Azure File Share, Azure Storage Queue |
| Cache | Azure Redis Cache (ioredis) |
| Secrets | Azure Key Vault |
| IaC | Terraform + Azure Provider |
| Containers | Docker, docker-compose, Nginx |
