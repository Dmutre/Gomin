FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.6.2

WORKDIR /workspace

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

ENV NX_DAEMON=false

RUN pnpm exec nx build api-gateway

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /workspace/dist/apps/api-gateway .

RUN npm install -g pnpm@10.6.2 && pnpm install --prod

EXPOSE 3000

CMD ["node", "main.js"]
