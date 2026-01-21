FROM node:20-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY tsconfig*.json vite.config.ts vite.server.config.ts ./
COPY public ./public
COPY src ./src

RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build:client && pnpm build:server

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && pnpm add -g vite

COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/tsconfig*.json ./
COPY --from=build /app/vite.config.ts /app/vite.server.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 80

CMD ["sh", "-c", "node -r tsconfig-paths/register dist/server/index.js & vite preview --config vite.config.ts --host 0.0.0.0 --port 80"]
