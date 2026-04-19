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

### API Gateway (`apps/gateway`)
- [x] NestJS HTTP gateway app: `ConfigModule` + Joi validation, `@gomin/logger` (Pino), global `ValidationPipe`, Swagger UI in non-production (`/api/docs`)
- [x] `GET /api/health` — liveness/readiness (`{ status: 'ok' }`)
- [x] `.env.example`, target `gateway:start` (build + `dotenv` з `apps/gateway/.env`) — без БД
- [x] `gateway-e2e` smoke test на `/api/health`
- [ ] Підключити gRPC-клієнти до auth / communication, HTTP-маршрутизація, JWT/CORS/rate limit (наступні кроки)

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
- [ ] Create `libs/infrastructure/cache` with Redis wrapper
- [ ] Implement CacheModule and CacheService
- [ ] Add Pub/Sub support for real-time features

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
- [ ] Add password management (verify, change)

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
- [ ] Create migrations (chats, chat_members, messages, message_keys, reactions, message_status)
- [ ] Set up table partitioning for messages (monthly)
- [ ] Create performance indexes

### gRPC Contracts
- [ ] Create `communication.proto` with chat and message operations
- [ ] Generate TypeScript types

### Chats Module
- [ ] Implement ChatsModule with 1-on-1, group, channel support
- [ ] Add member management and access control

### Messages Module
- [ ] Implement MessagesModule with E2EE encryption
- [ ] Create E2EE helper (AES-256 content encryption, RSA key encryption)
- [ ] Add message CRUD operations with pagination

### Message Status Module
- [ ] Implement delivery and read receipts tracking

### Reactions Module
- [ ] Implement message reactions system

### Typing Indicators Module
- [ ] Implement Redis-based typing indicators with TTL

### WebSocket Gateway
- [ ] Set up Socket.IO/ws server with authentication
- [ ] Implement connection/disconnection handling
- [ ] Integrate with PresenceService
- [ ] Create event handlers (message.send, message.new, typing, user.online)
- [ ] Set up Redis Pub/Sub for multi-instance scaling

### Service Configuration
- [ ] Configure gRPC server (port 5003) and WebSocket server (port 5004)
- [ ] Add health checks and metrics
- [ ] Configure graceful shutdown

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
- [x] NestJS API Gateway app (`apps/gateway`) — базовий bootstrap, конфіг, логування, Swagger (dev)
- [ ] Reverse proxy / edge (Kong, Traefik, Nginx) перед NestJS за потреби
- [ ] Configure SSL/TLS (Let's Encrypt or Cloudflare Tunnel)

### Routing & Security
- [ ] Configure service routing (gRPC/HTTP до auth, communication, …)
- [ ] Implement JWT validation with Identity Service
- [ ] Add rate limiting and CORS policies
- [ ] Add security headers
- [ ] Implement request ID generation (traceId)

### Monitoring
- [x] HTTP access logging via Pino (`nestjs-pino` / `@gomin/logger`)
- [ ] Implement opentelemetry metric system
- [x] Health check endpoint (`GET /api/health`)

---

## ☁️ Phase 7: Kubernetes Deployment

**Стан:** Репозиторій підготовлено (Helm, CI/CD, bootstrap для GitHub Actions, README). **Кластер ще не піднятий**, міграції на стенді **не прогонені** — це наступні кроки після доступного Kubernetes.

### Docker Images
- [x] Dockerfiles для `api-gateway`, `auth`, `communication-service`
- [x] Build/push у GHCR через GitHub Actions (`build-and-deploy.yml`)
- [ ] Перевірити збірку/деплой на живому кластері end-to-end

### Kubernetes Resources (Helm у репо)
- [x] Namespaces — `charts/platform`
- [x] Deployments, Services, Jobs (міграції), HPA, `RollingUpdate` — у чартах сервісів
- [x] Секрети — патерн `scripts/setup-secrets.sh` + посилання з чартів
- [ ] Застосувати все на реальному кластері + smoke-тести
- [ ] Ingress з TLS

### Helm & CI/CD
- [x] Локальні чарти: `platform`, `infra`, `api-gateway`, `auth`, `communication-service`
- [x] Workflow: optional migrate Job + `helm upgrade --install --atomic`
- [x] Тег образу: якщо інпут `version` порожній — з поля `version` у кореневому `package.json` (з префіксом `v` за потреби); якщо там немає версії — фолбек `v0.1.0`
- [x] `k8s/bootstrap/`: `ci-rbac.yaml` (SA для GitHub Actions), `generate-ci-kubeconfig.sh`
- [x] README: перший запуск кластера, CI/CD, bootstrap
- [x] Executable bit у git для `scripts/setup-secrets.sh`, `k8s/bootstrap/generate-ci-kubeconfig.sh`
- [ ] Окремий Helm chart repository / OCI registry (за потреби)

### Databases & Infrastructure
- [x] У чарті `infra`: Redis + MinIO (StatefulSets; для dev/stage)
- [ ] PostgreSQL у кластері або стабільне підключення до зовнішньої БД + успішні міграції
- [ ] Redis Cluster (3+3) / прод-режим — за потреби
- [ ] RabbitMQ у кластері
- [ ] MinIO distributed / прод-режим — за потреби
- [ ] Persistent volumes і бекапи

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
- [ ] Run security scanner (OWASP ZAP)
- [ ] Test for common vulnerabilities (SQL injection, XSS, CSRF)
- [ ] Test authentication, authorization, and E2EE
- [ ] Conduct penetration testing (if budget allows)

---

## 📱 Phase 10: Client Applications (Optional)

### Web Client
- [ ] Set up React/Next.js project
- [ ] Implement authentication and chat UI
- [ ] Implement E2EE key generation and message encryption
- [ ] Connect to WebSocket
- [ ] Add Web Push API support

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

## 🎓 Final Phase

- [ ] Rewrite everything to Go (just kidding... unless? 🐹)

---
