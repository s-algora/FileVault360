FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/frontend/package*.json apps/frontend/
COPY packages/shared-types/package*.json packages/shared-types/
RUN npm ci --workspace=apps/frontend --workspace=packages/shared-types
COPY apps/frontend/ apps/frontend/
COPY packages/shared-types/ packages/shared-types/
COPY tsconfig.json ./
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/frontend

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
