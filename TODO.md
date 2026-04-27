# Gomin Messenger - Development Roadmap

## ✅ Recent Completed: Service Identity & Auth Guards

### Service Identity (`@gomin/service-identity`)
- [x] Service identity seeding (Permissions, ServiceIdentities, ServicePermissions)
- [x] MicroserviceIdentityModule (forRoot/forRootAsync) with gRPC client
- [x] MicroserviceIdentityAuthService (token fetch, re-auth)
- [x] MicroserviceIdentityStore (public key cache via getPublicKeys)
- [x] MicroserviceIdentityGuard (token + permission validation for consumers)
- [x] RequirePermission decorator, SERVICE_PAYLOAD_KEY
- [x] Permissions: USERS_READ, USERS_WRITE, SESSIONS_READ, SESSIONS_WRITE, SESSIONS_INVALIDATE
- [x] JWT verifier (verifyJwtRs256, JwtVerificationError) exported

### gRPC Client (`@gomin/grpc`)
- [x] ServiceIdentityGrpcClient (authenticateServiceIdentity, getPublicKeys)
- [x] ServiceIdentityClientModule (register/registerAsync with optional URL)

### Auth Service
- [x] MicroserviceException handling (user-auth, service-identity services)
- [x] GrpcExceptionFilter for gRPC error responses
- [x] LocalIdentityModule (LocalIdentityGuard, LocalIdentityService)
- [x] LocalIdentityGuard – validates service tokens using local JWT config (no self-calls)
- [x] UserAuthGrpcController – guard + RequirePermission on all methods
- [x] Service identity seeding via ts-node (path alias @gomin/service-identity/seeding)

### Seed & Tooling
- [x] Knex seeds run with ts-node + tsconfig-paths
- [x] Path alias for seeding-only import (avoids decorator/grpc in seed context)

### API Gateway (`apps/api-gateway`)
- [x] NestJS HTTP gateway: `ConfigModule` + Joi, `@gomin/logger`, global `ValidationPipe`, Swagger in dev (`/api/docs`)
- [x] `GET /api/health`
- [x] gRPC clients for auth and communication (`AuthGrpcModule`, `CommunicationGrpcModule`)
- [x] HTTP routes: auth, chats, messages, sender-keys; `SessionGuard` (session validation via auth gRPC)
- [x] WebSocket (Socket.IO + Redis adapter): chat subscriptions, typing, presence ping, sender-key fan-out
- [ ] Rate limiting, stricter CORS / production policies (as needed)

---

## 🎯 Phase 0: Project Foundation

### Monorepo Setup & Infrastructure
- [x] Initialize NX monorepo with pnpm workspace
- [x] Configure TypeScript, ESLint, Prettier
- [ ] Configure Husky
- [x] Set up folder structure (apps/, libs/)
- [ ] Create Docker Compose for local development (PostgreSQL, Redis, RabbitMQ, MinIO)
- [ ] Write initial README and setup guide

---

## 📦 Phase 1: Core Infrastructure Libraries

### Database Infrastructure
- [x] Create `libs/infrastructure/database` with Knex wrapper
- [x] Implement DatabaseModule and DatabaseService (nest-knexjs)
- [ ] Add connection pooling and health checks

### Cache Infrastructure
- [x] `libs/infrastructure/redis` — RedisModule, RedisService, Redis Pub/Sub (`RedisPubSubService`) for gateway / WebSocket
- [ ] Standalone `libs/infrastructure/cache` (TTL / key-policy wrapper) if needed

### Logger Infrastructure
- [x] Create `libs/infrastructure/logger` with Pino
- [x] Configure structured logging (JSON format)
- [ ] Replace or configure logger to be possible to have context passed to it
- [ ] Add correlation ID (traceId) support
- [ ] Create logging interceptors

### Queue Infrastructure
- [ ] Create `libs/infrastructure/queue` with RabbitMQ
- [ ] Implement QueueModule and QueueService
- [ ] Prepare queue for notification service handling

### Storage Infrastructure
- [ ] Create `libs/infrastructure/storage` with MinIO
- [ ] Implement StorageModule and StorageService
- [ ] Add presigned URL generation

### Observability Infrastructure
- [ ] Create `libs/infrastructure/observability`
- [ ] Configure OpenTelemetry SDK
- [ ] Set up auto-instrumentation for HTTP, gRPC, database
- [ ] Configure trace and metrics exporters

### Common Utilities
- [ ] Create `libs/common/validators` with password validators
- [x] Create `libs/common/guards` (MicroserviceIdentityGuard, LocalIdentityGuard)
- [ ] Create `libs/common/interceptors` (Logging, Timeout, Error handling)
- [x] Create `libs/common/filters` (GrpcExceptionFilter, MicroserviceException)
- [ ] Create `libs/common/decorators` (@CurrentUser, @GrpcUser)

### Models & Types
- [x] Create `libs/models/enums` (DeviceType, RevokeReason in user-session domain)
- [x] Create `libs/models/entities` (User, UserSession db types)
- [x] Create `libs/models/dtos` (DTOs with validation in auth module)

---

## 🔐 Phase 2: Identity & Access Service

### Database Setup
- [x] Create Knex migrations (users, sessions)
- [x] Set up UUID extension
- [x] Create migrations (ServiceIdentities, Permissions, ServicePermissions)
- [ ] Create migrations (contacts, service_tenants, audit_logs)
- [x] Create seed data for service identities

### gRPC Contracts
- [x] Create `auth.proto` for public API (Register, Login, Sessions management)
- [x] Create `identity.proto` for internal API (ValidateToken, GetUser, CheckPermission)
- [x] Configure buf CLI and generate TypeScript types

### Users Module
- [x] Implement UsersModule with repository and service
- [x] Add user CRUD operations with E2EE key storage
- [x] Create gRPC controller endpoints (via UserAuthModule)

### Sessions Module
- [x] Implement SessionsModule (UserSessionModule) with PostgreSQL storage
- [ ] Add Redis hybrid storage
- [ ] Add sliding window session expiry (60 days max, 30 days inactivity)
- [ ] Implement session limit enforcement (max 10 sessions)
- [ ] Add debounced DB writes (15 min interval)

### Presence Module
- [ ] Implement PresenceModule with Redis-based storage
- [ ] Add online/offline/away status management
- [ ] Create cleanup cron job for stale presence

### Auth Module (Public API)
- [x] Implement UserAuthModule with registration and login
- [x] Add E2EE keys validation (storage)
- [x] Create session management endpoints (terminate, terminate all with re-auth)
- [x] Change password (gRPC + session rotation)

### Identity Module (Internal API)
- [x] Implement ServiceIdentityModule for service-to-service auth (AuthenticateServiceIdentity, GetPublicKeys)
- [x] Add token validation (MicroserviceIdentityGuard, LocalIdentityGuard)
- [ ] Add user data access endpoints (GetUserById, GetPublicKey)
- [x] Add permission checking (RequirePermission decorator)

### Contacts Module (Optional for MVP)
- [ ] Implement ContactsModule with add/accept/block functionality

### Service Configuration
- [ ] Configure dual gRPC servers (port 5001 public, 5002 internal)
- [ ] Set up environment variables
- [ ] Add health check and metrics endpoints
- [ ] Configure graceful shutdown

---

## 💬 Phase 3: Communication Service

### Database Setup
- [x] Migrations: chats, chat_members, messages, message_status, message_reactions, sender keys (`apps/communication-service/database/migrations/…`)
- [x] Indexes in migrations (baseline); extra performance indexes under load as needed

### gRPC Contracts
- [x] `communication.proto` (chats, messages, reactions, read/mark, sender keys)
- [x] Generated TypeScript types in `@gomin/grpc`

### Chats Module
- [x] ChatsModule: DIRECT/GROUP, members, roles, ownership transfer (see `chat.grpc.controller`, services/repositories)
- [ ] Full CHANNEL support from proto (DB enum currently has no CHANNEL — extend if needed)

### Messages Module
- [x] E2EE payload storage (encryptedContent, iv, authTag, keyVersion, iteration); CRUD, pagination
- [ ] Dedicated server-side “crypto helper” not required for current model (encryption on client)

### Message Status Module
- [x] Read/delivery via `message_status` + gRPC `MarkAsRead` / service logic

### Reactions Module
- [x] Reactions in DB + gRPC add/remove reaction

### Typing / presence (real-time)
- [x] In api-gateway: `typing:start` / `typing:stop`, `presence:ping`, `presence:update` via Redis Pub/Sub (not a separate Nest module in communication-service)

### WebSocket Gateway
- [x] Socket.IO, session-token auth, Redis adapter for scaling
- [x] Chat subscriptions, typing, presence, sender-key delivery between clients
- [ ] Full parity with all README events (e.g. `message.new`) — verify `MessagingGateway` and `broadcastToChat` from HTTP handlers

### Service Configuration
- [x] gRPC microservice (`GRPC_PORT`, e.g. 5001 in `communication-service` main)
- [x] Metrics: `communication.metrics` in communication-service; tracing in `tracing.ts`
- [ ] Dedicated WS-only port (today WS shares gateway HTTP port) per target architecture
- [ ] Graceful shutdown — tighten explicitly if needed

---

## 📁 Phase 4: Media Service

### Database Setup
- [ ] Create migrations (media_files, processing_jobs)
- [ ] Configure MinIO buckets and policies

### gRPC Contracts
- [ ] Create `media.proto` with upload/download operations
- [ ] Generate Go code from proto

### Upload & Storage Services
- [ ] Implement upload flow (InitUpload with presigned URL, CompleteUpload)
- [ ] Add file validation (type, size, magic bytes)
- [ ] Integrate ClamAV for virus scanning

### Processing Services
- [ ] Implement image processing (thumbnails, EXIF removal, optimization)
- [ ] Implement video processing (transcoding, thumbnails) - optional for MVP

### Background Workers
- [ ] Set up RabbitMQ consumers for async processing
- [ ] Implement retry logic and dead letter queues

### Service Configuration
- [ ] Configure gRPC server (port 5005)
- [ ] Add health checks and metrics

---

## 🔔 Phase 5: Notification Service

### Database Setup
- [ ] Create migrations (notifications, preferences, device_tokens)

### gRPC Contracts
- [ ] Create `notification.proto` with notification operations
- [ ] Generate TypeScript types

### Push Notifications Module
- [ ] Integrate Firebase Admin SDK (FCM) and APNS
- [ ] Implement push notification delivery with error handling

### Email Notifications Module (Optional for MVP)
- [ ] Integrate email service (Nodemailer/SendGrid)
- [ ] Create email templates

### Notifications Module
- [ ] Implement notifications CRUD with preferences

### Device Tokens Module
- [ ] Implement device registration and management

### Background Workers
- [ ] Set up async notification delivery workers
- [ ] Implement retry logic

### Service Configuration
- [ ] Configure gRPC server (port 5006)
- [ ] Add health checks and metrics

---

## 🌐 Phase 6: API Gateway

### Gateway Setup
- [x] NestJS API Gateway (`apps/api-gateway`) — bootstrap, config, logging, Swagger (dev)
- [ ] Reverse proxy / edge (Traefik in k8s — see Helm; locally as needed)
- [x] SSL/TLS at edge (Let's Encrypt / Cloudflare)

### Routing & Security
- [x] Routing: HTTP → controllers → gRPC auth / communication
- [x] Session-protected routes: `SessionGuard` (session check via auth service)
- [ ] Rate limiting, strict CORS, security headers (as needed)
- [x] Consistent request / trace ID across all services

### Monitoring
- [x] HTTP access logging via Pino (`nestjs-pino` / `@gomin/logger`)
- [ ] Implement opentelemetry metric system
- [x] Health check endpoint (`GET /api/health`)

---

## ☁️ Phase 7: Kubernetes Deployment

**Status:** Repo is ready (Helm, CI/CD, GitHub Actions bootstrap, README). **Cluster not necessarily provisioned**; **migrations on a shared environment not guaranteed** — next steps once Kubernetes is available.

### Docker Images
- [x] Dockerfiles for `api-gateway`, `auth`, `communication-service`
- [x] Build/push to GHCR via GitHub Actions (`build-and-deploy.yml`)
- [x] Verify build/deploy end-to-end on a live cluster

### Kubernetes Resources (Helm in repo)
- [x] Namespaces — `charts/platform`
- [x] Deployments, Services, Jobs (migrations), HPA, `RollingUpdate` in service charts
- [x] Secrets — `scripts/setup-secrets.sh` pattern + chart references
- [ ] Apply everything to a real cluster + smoke tests
- [x] Ingress with TLS

### Helm & CI/CD
- [x] Local charts: `platform`, `infra`, `api-gateway`, `auth`, `communication-service`
- [x] Workflow: optional migrate Job + `helm upgrade --install --atomic`
- [x] Image tag: if workflow `version` input is empty — from root `package.json` `version` (with `v` prefix if needed); if missing — fallback `v0.1.0`
- [x] `k8s/bootstrap/`: `ci-rbac.yaml` (GitHub Actions SA), `generate-ci-kubeconfig.sh`
- [x] README: first cluster run, CI/CD, bootstrap
- [x] Executable bit in git for `scripts/setup-secrets.sh`, `k8s/bootstrap/generate-ci-kubeconfig.sh`
- [x] Separate Helm chart repo / OCI registry if needed

### Databases & Infrastructure
- [x] `infra` chart: Redis + MinIO (StatefulSets; dev/stage)
- [ ] PostgreSQL in-cluster or stable external DB + successful migrations
- [ ] Redis Cluster (3+3) / production mode if needed
- [ ] RabbitMQ in cluster
- [ ] MinIO distributed / production mode if needed
- [ ] Persistent volumes and backups

### Service Mesh (Optional)
- [ ] Install Linkerd or Istio
- [ ] Enable automatic mTLS between services
- [ ] Configure observability features

### SSL & Ingress
- [ ] Install Nginx Ingress Controller
- [ ] Install cert-manager with Let's Encrypt
- [ ] Configure TLS certificates

### Deployment Testing
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Verify end-to-end flows

---

## 📊 Phase 8: Observability & Monitoring

### Metrics Collection
- [ ] Deploy Prometheus with Helm
- [ ] Configure service discovery and scrape configs
- [ ] Set up recording and alerting rules

### Visualization
- [ ] Deploy Grafana with Helm
- [ ] Configure Prometheus data source
- [ ] Create dashboards (service health, RED metrics, database, WebSocket, uploads)
- [ ] Configure alerts

### Distributed Tracing
- [ ] Deploy Jaeger with Helm
- [ ] Configure OpenTelemetry SDK in all services
- [ ] Verify trace collection and traceId propagation

### Centralized Logging
- [ ] Deploy ELK Stack (Elasticsearch, Logstash/Fluentd, Kibana)
- [ ] Configure log aggregation from all pods
- [ ] Create log dashboards with traceId correlation

### OpenTelemetry Collector
- [ ] Deploy OpenTelemetry Collector
- [ ] Configure exporters (Jaeger, Prometheus, Elasticsearch)
- [ ] Verify automatic correlation between metrics, traces, and logs

### Alerting
- [ ] Configure Alertmanager
- [ ] Set up notification channels (Slack, email, PagerDuty)
- [ ] Create alert rules (errors, latency, service down, database issues, queue backlog)

---

## 🧪 Phase 9: Testing & Quality Assurance

### Unit & Integration Testing
- [ ] Write unit tests for all services (target 80%+ coverage)
- [ ] Write integration tests for database and gRPC operations
- [ ] Write WebSocket integration tests
- [ ] Set up test coverage reporting and CI pipeline

### End-to-End Testing
- [ ] Write E2E tests for authentication flow
- [ ] Write E2E tests for messaging flow
- [ ] Write E2E tests for file upload
- [ ] Set up E2E test environment

### Load Testing
- [ ] Install k6 or Artillery
- [ ] Create load test scripts (registration, login, messaging, uploads, WebSocket)
- [ ] Run load tests and identify bottlenecks
- [ ] Optimize based on results

### Security Testing
- [ ] Manually review OWASP Top 10 checklist against the codebase — identify and fix applicable vulnerabilities (injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, known vulnerabilities, insufficient logging)
- [ ] Run security scanner (OWASP ZAP)
- [ ] Test for common vulnerabilities (SQL injection, XSS, CSRF)
- [ ] Test authentication, authorization, and E2EE
- [ ] Conduct penetration testing (if budget allows)

---

## 📱 Phase 10: Client Applications (Optional)

### Web Client
- [x] Vite + React (`apps/web`): login/register, chats, sessions, settings
- [x] E2EE keys and message encryption (Web Crypto) — baseline flow
- [x] WebSocket gateway connection
- [ ] Web Push, UX polish, all edge cases covered

### Mobile Client
- [ ] Set up React Native project
- [ ] Implement authentication and chat UI
- [ ] Implement E2EE with Secure Storage
- [ ] Connect to WebSocket
- [ ] Add FCM/APNS push notifications

---

## 📝 Phase 11: Documentation

### Technical Documentation
- [ ] Generate Swagger/OpenAPI docs
- [ ] Document gRPC proto files
- [ ] Create Postman collection
- [ ] Document system architecture and sequence diagrams
- [ ] Document database schemas and E2EE implementation

### Deployment Documentation
- [ ] Write Kubernetes deployment guide
- [ ] Document environment variables
- [ ] Document scaling and backup strategies

### Developer Documentation
- [ ] Write contributing guide
- [ ] Document code style and git workflow
- [ ] Create onboarding guide for new developers

---

## 🚀 Phase 12: Production Launch

### Pre-launch
- [ ] Run full E2E and load tests
- [ ] Review security checklist
- [ ] Set up monitoring alerts
- [ ] Configure automated backups
- [ ] Prepare rollback plan and incident response
- [ ] Write README files for every app and lib to explain the purpose of this part

### Launch
- [ ] Deploy to production
- [ ] Conduct soft launch with beta testers
- [ ] Monitor system closely and fix critical bugs
- [ ] Public launch
- [ ] Set up on-call rotation

### Post-Launch
- [ ] Review and optimize performance
- [ ] Plan feature roadmap
- [ ] Continuous monitoring and improvement

---

## 📈 Future Enhancements (Post-MVP)

- [ ] Elasticsearch integration for message search
- [ ] Video call support (WebRTC)
- [ ] Voice messages
- [ ] Message forwarding and scheduling
- [ ] Disappearing messages
- [ ] Bots and integrations
- [ ] Advanced analytics

---

## 🔬 Research / Advanced Cryptography

### TreeKEM / MLS (Message Layer Security) — RFC 9420

Replace the current Sender Key protocol with MLS using a binary ratchet tree of participants:

- Participants are leaves of a binary tree; each internal node holds the shared key of its subtree
- Key rotation on member removal: only the path from the leaf to the root is updated → **O(log N)** instead of O(N)
- 1000-member group: ~10 node updates instead of 999 — qualitatively different scalability
- Full forward secrecy and post-compromise security with log-scale overhead
- Standardized by IETF (RFC 9420, 2023) — reference libraries: `openmls` (Rust), `mls-rs`

**Related: rewrite backend services in Go**
- Node.js / V8 is single-threaded with GC pauses; crypto-heavy operations (HMAC ratchet over large trees) block the event loop
- Go goroutines and native threads give predictable latency without blocking
- Target services: `apps/auth`, `apps/communication-service` (api-gateway can follow or stay)
- Proto contracts remain unchanged — only handler implementations need to be rewritten

---

## 🎓 Final Phase

- [ ] Rewrite everything to Go (just kidding... unless? 🐹)

---
