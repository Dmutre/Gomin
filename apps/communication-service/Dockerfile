FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.6.2

WORKDIR /workspace

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

ENV NX_DAEMON=false

RUN pnpm exec nx build communication-service

RUN node_modules/.bin/tsc --project apps/communication-service/tsconfig.migrations.json

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /workspace/dist/apps/communication-service .
COPY --from=builder /workspace/node_modules/tslib ./node_modules/tslib

RUN npm install -g pnpm@10.6.2 && pnpm install --prod

EXPOSE 5001

CMD ["node", "main.js"]
