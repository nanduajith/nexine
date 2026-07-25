# --- Build stage: produce the static, no-egress bundle ---
FROM node:22-alpine AS build
WORKDIR /app

# Install pnpm (pinned to match packageManager).
RUN npm install -g pnpm@11.17.0

# Install dependencies first (better layer caching).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY tools ./tools
COPY tsconfig.base.json tsconfig.json ./
RUN pnpm install --frozen-lockfile

# Build the host app (strict connect-src 'none' CSP is injected at build time).
RUN pnpm build

# --- Runtime stage: serve static files with nginx, no app server ---
FROM nginx:1.27-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/host/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -q --spider http://localhost/ || exit 1
