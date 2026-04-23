FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.6.2

WORKDIR /app

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY . .

ARG VITE_API_URL
ARG VITE_WS_URL

RUN VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL pnpm run build

# ── Serve stage ────────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
