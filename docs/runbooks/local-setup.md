# Local Setup Runbook

This guide walks you through running FileVault360 locally.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | https://nodejs.org |
| npm | ≥ 10 | Bundled with Node.js |
| Docker & Compose | any | https://docs.docker.com/get-docker/ |
| (Optional) Azure CLI | any | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli |

---

## Option A – Full Local (with Redis, no Azure)

This runs all services locally. File operations that need Azure Storage will gracefully degrade (warn and skip).

### 1. Install dependencies
```bash
cd /path/to/FileVault360
npm install
```

### 2. Configure the API
```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` – the minimum required for local dev (Redis only):
```
PORT=3001
JWT_SECRET=local-dev-secret
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TLS=false
```

### 3. Start Redis
```bash
docker run -d --name fv360-redis -p 6379:6379 redis:7-alpine
```

### 4. Build shared packages
```bash
npm run build --workspace=packages/shared-types
npm run build --workspace=packages/shared-utils
npm run build --workspace=packages/config
```

### 5. Start services (in separate terminals)
```bash
# Terminal 1 – API
npm run dev --workspace=apps/api

# Terminal 2 – Worker
npm run dev --workspace=apps/worker

# Terminal 3 – Frontend
npm run dev --workspace=apps/frontend
```

### 6. Open the app
Navigate to http://localhost:5173 and log in with any email/password.

---

## Option B – Docker Compose (all services)

### Prerequisites
- Docker Desktop running

### Steps
```bash
# From repo root
cd docker
docker compose up --build
```

Services will be available at:
- Frontend: http://localhost:80
- API: http://localhost:3001
- Redis: localhost:6379

To stop:
```bash
docker compose down
```

To stop and remove volumes:
```bash
docker compose down -v
```

---

## Option C – Full Azure Integration

### 1. Deploy Azure infrastructure
```bash
cd infra/terraform
terraform init
terraform plan -var="environment=dev"
terraform apply -var="environment=dev"
```

### 2. Get outputs
```bash
terraform output -json > /tmp/tf-outputs.json
```

### 3. Populate .env
Set all values in `apps/api/.env` from Terraform outputs:
- `COSMOS_ENDPOINT` ← `cosmos_endpoint`
- `COSMOS_KEY` ← `cosmos_primary_key`
- `STORAGE_CONNECTION_STRING` ← `storage_connection_string`
- `REDIS_HOST` ← `redis_hostname`
- `REDIS_PORT=6380`
- `REDIS_PASSWORD` ← `redis_primary_access_key`
- `REDIS_TLS=true`
- `KEY_VAULT_URL` ← `key_vault_uri`

---

## Troubleshooting

### API fails to start: "Cannot find module '@filevault360/config'"
Run `npm install` from the repo root to symlink workspace packages.

### Redis connection errors in logs
These are non-fatal. The API will still serve requests; caching will be skipped.

### Cosmos DB errors in logs
These are non-fatal. The API falls back to in-memory responses (no persistence).

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Frontend shows blank page
Check browser console. Ensure the API is running and accessible at localhost:3001.
