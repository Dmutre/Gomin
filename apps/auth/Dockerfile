FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.6.2

WORKDIR /workspace

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

ENV NX_DAEMON=false

RUN pnpm exec nx build auth

RUN node_modules/.bin/tsc --project apps/auth/tsconfig.migrations.json

FROM node:22-alpine AS production

# argon2 is a native C++ addon — needs python3 + gcc to compile for Alpine
RUN apk add --no-cache python3 build-base

WORKDIR /app

COPY --from=builder /workspace/dist/apps/auth .
COPY --from=builder /workspace/node_modules/tslib ./node_modules/tslib

RUN npm install -g pnpm@10.6.2 && \
    pnpm install --prod && \
    apk del python3 build-base

EXPOSE 5000

CMD ["node", "main.js"]
