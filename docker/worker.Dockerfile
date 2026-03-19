FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/worker/package*.json apps/worker/
COPY packages/config/package*.json packages/config/
COPY packages/shared-types/package*.json packages/shared-types/
COPY packages/shared-utils/package*.json packages/shared-utils/
RUN npm ci --workspace=apps/worker --workspace=packages/config --workspace=packages/shared-types --workspace=packages/shared-utils
COPY apps/worker/ apps/worker/
COPY packages/config/ packages/config/
COPY packages/shared-types/ packages/shared-types/
COPY packages/shared-utils/ packages/shared-utils/
COPY tsconfig.json ./
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=packages/shared-utils
RUN npm run build --workspace=packages/config
RUN npm run build --workspace=apps/worker

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
