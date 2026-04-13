# Gomin - High-Load Messenger Platform

A scalable messenger application built with microservices architecture, designed to handle high load with End-to-End encryption support.

> **Note:** This project was developed as a **bachelor diploma work** and is released as an **open-source** project.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Microservices](#microservices)
- [Security](#security)
- [Infrastructure](#infrastructure)
- [Data Flow](#data-flow)
- [Getting Started](#getting-started)
- [Development](#development)

---

## 🎯 Project Overview

Gomin is a modern messenger platform built on microservices architecture with focus on:

- **Scalability**: Horizontal scaling of each component
- **Security**: End-to-End encryption for messages
- **Performance**: Optimized for high-load scenarios
- **Reliability**: Distributed architecture with fault tolerance
- **Real-time Communication**: WebSocket support for instant messaging

### Key Features

- 📱 One-to-one and group chats
- 🔒 End-to-End encryption (E2EE)
- 📁 Media file sharing (images, videos, documents)
- 🔔 Push notifications
- 🔍 Message search
- 👥 User presence (online/offline status)
- ✍️ Typing indicators
- ✅ Read receipts
- 📊 Message reactions

---

## 🏗️ Architecture

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                         │
│              (Web, Mobile, Desktop clients)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ WebSocket/HTTP
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY / INGRESS                        │
│         (Kong/Traefik + Rate Limiting + Auth)                   │
└─────┬───────────────────────────────────────────────────┬───────┘
      │                                                   │
      │            Kubernetes Cluster                     │
      │                                                   │
┌─────▼───────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │        IDENTITY & ACCESS SERVICE                     │       │
│  │              (Node.js/NestJS)                        │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │ - User authentication (JWT, OAuth2)                  │       │
│  │ - User profiles & settings                           │       │
│  │ - Contacts management                                │       │
│  │ - Access control & permissions                       │     │
│  │                                                      │     │
│  │ DB: PostgreSQL (users, sessions, contacts)           │     │
│  │ Cache: Redis (sessions, tokens)                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐     │
│  │          COMMUNICATION SERVICE                       │     │
│  │         (Node.js/NestJS + Go workers)                │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ - Chat/Room management                               │     │
│  │ - Message CRUD & delivery                            │     │
│  │ - Real-time WebSocket gateway                        │     │
│  │ - Typing indicators & read receipts                  │     │
│  │ - Message reactions & editing                        │     │
│  │                                                      │     │
│  │ DB: PostgreSQL (chats, messages - partitioned)       │     │
│  │ Cache: Redis (recent msgs, presence, pub/sub)        │     │
│  │ Search: Elasticsearch (message search)               │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐     │
│  │             MEDIA SERVICE                            │     │
│  │            (Go - high throughput)                    │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ - File upload/download (presigned URLs)              │     │
│  │ - Image processing & thumbnails                      │     │
│  │ - Video transcoding (async workers)                  │     │
│  │ - File validation & antivirus scanning               │     │
│  │ - EXIF data cleaning                                 │     │
│  │                                                      │     │
│  │ Storage: MinIO (S3-compatible)                       │     │
│  │ DB: PostgreSQL (metadata)                            │     │
│  │ Queue: RabbitMQ (async processing)                   │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │          NOTIFICATION SERVICE                        │     │
│  │            (Node.js/NestJS)                          │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ - Push notifications (FCM, APNS)                     │     │
│  │ - Email notifications                                │     │
│  │ - In-app notifications                               │     │
│  │ - Notification preferences                           │     │
│  │                                                      │     │
│  │ DB: PostgreSQL (notification history)                │     │
│  │ Queue: RabbitMQ (async delivery)                     │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│         All services communicate via gRPC                      │
│                                                                 │
└─────┬──────────────────┬──────────────────┬────────────────────┘
      │                  │                  │
┌─────▼──────┐  ┌────────▼────────┐  ┌─────▼──────────┐
│  RabbitMQ  │  │   Event Bus     │  │  File Storage  │
│  (Queue)   │  │   (RabbitMQ)    │  │  MinIO (S3)    │
└─────┬──────┘  └────────┬────────┘  └─────┬──────────┘
      │                  │                  │
┌─────▼──────────────────▼──────────────────▼────────────┐
│                   DATA LAYER                            │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐        │
│  │PostgreSQL│  │  Redis   │  │ Elasticsearch │        │
│  │(Primary) │  │ (Cache)  │  │   (Search)    │        │
│  └──────────┘  └──────────┘  └───────────────┘        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│        OBSERVABILITY & MONITORING LAYER                 │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │
│  │Prometheus│  │  Jaeger  │  │  ELK Stack   │         │
│  │(Metrics) │  │(Tracing) │  │   (Logs)     │         │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘         │
│       └─────────────▼────────────────┘                  │
│              ┌───────▼────────┐                         │
│              │    Grafana     │                         │
│              │  (Dashboards)  │                         │
│              └────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

### Domain-Driven Design

Services are organized by business domains:

- **Identity & Access**: User management, authentication, authorization
- **Communication**: Chat functionality, messaging, real-time features
- **Media**: File handling, storage, processing
- **Notification**: Push, email, in-app notifications

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime for most services | 18+ |
| **NestJS** | Framework for microservices | 10+ |
| **Go** | Media Service (high throughput) | 1.21+ |
| **TypeScript** | Type safety | 5+ |
| **gRPC** | Inter-service communication | - |

### Databases & Storage

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |
| **Redis** | Caching, sessions, pub/sub |
| **MinIO** | S3-compatible object storage |
| **Elasticsearch** | Full-text search |

### Message Broker

| Technology | Purpose |
|------------|---------|
| **RabbitMQ** | Async message queue, events |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Kubernetes** | Container orchestration |
| **Docker** | Containerization |
| **Istio** | Service mesh (optional) |
| **Helm** | K8s package manager |

### Monitoring & Observability

| Technology | Purpose |
|------------|---------|
| **Prometheus** | Metrics collection |
| **Grafana** | Dashboards & visualization |
| **Jaeger** | Distributed tracing |
| **ELK Stack** | Centralized logging |

### API Gateway

| Technology | Purpose |
|------------|---------|
| **Kong** / **Traefik** | API Gateway, rate limiting, auth |

---

## 🔧 Microservices

### 1. Identity & Access Service

**Responsibilities:**
- User registration & authentication
- JWT token management
- OAuth2 integration
- User profiles & settings
- Contact management
- Permission & role-based access control

**API Endpoints:**
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /users/:id
PUT    /users/:id
GET    /users/:id/contacts
POST   /users/:id/contacts
```

**gRPC Services:**
```protobuf
service IdentityService {
  rpc Authenticate(AuthRequest) returns (AuthResponse);
  rpc GetUserProfile(UserIdRequest) returns (UserProfile);
  rpc CheckPermission(PermissionRequest) returns (PermissionResponse);
  rpc GetUsersByIds(UserIdsRequest) returns (UsersResponse);
}
```

**Database Schema (Auth / users):**
```sql
Users (
  id, username, email, password_hash,  -- Argon2
  public_key, encrypted_private_key,
  encryption_salt, encryption_iv, encryption_auth_tag,
  avatar_url, ...
)
UserSessions (id, user_id, session_token, device_id, ...)
```

---

### 2. Communication Service

**Responsibilities:**
- Chat & room management (1-on-1, groups, channels)
- Message CRUD operations
- Real-time WebSocket gateway
- Message delivery & status tracking
- Typing indicators & read receipts
- Message reactions & editing

**API Endpoints:**
```
POST   /chats
GET    /chats
GET    /chats/:id
POST   /chats/:id/members
POST   /messages
GET    /chats/:id/messages
PUT    /messages/:id
DELETE /messages/:id
POST   /messages/:id/reactions
```

**WebSocket Events:**
```typescript
// Client -> Server
{ type: 'message.send', payload: {...} }
{ type: 'typing.start', payload: {...} }
{ type: 'message.read', payload: {...} }

// Server -> Client
{ type: 'message.new', payload: {...} }
{ type: 'message.delivered', payload: {...} }
{ type: 'user.online', payload: {...} }
{ type: 'typing.indicator', payload: {...} }
```

**gRPC Services:**
```protobuf
service CommunicationService {
  rpc CreateChat(CreateChatRequest) returns (ChatResponse);
  rpc SendMessage(SendMessageRequest) returns (MessageResponse);
  rpc GetMessages(GetMessagesRequest) returns (MessagesResponse);
  rpc GetChatsByUserId(UserIdRequest) returns (ChatsResponse);
  rpc MarkAsRead(MarkAsReadRequest) returns (StatusResponse);
}
```

**Database Schema (E2EE-oriented fields):**
```sql
chats (id, type, name, key_version, ...)
chat_members (chat_id, user_id, joined_at, can_read_from, ...)
messages (
  id, chat_id, sender_id,
  encrypted_content, iv, auth_tag, key_version,
  type, created_at, ...
)
message_keys (message_id, user_id, encrypted_key)  -- RSA-OAEP wrapped AES key per recipient
message_reactions (message_id, user_id, emoji, ...)
message_status (message_id, user_id, status, delivered_at, read_at)
```


---

### 3. Media Service

**Responsibilities:**
- File upload/download with presigned URLs
- Image processing & thumbnail generation
- Video transcoding
- File validation (magic bytes, size, type)
- Antivirus scanning (ClamAV)
- EXIF data removal for privacy

**Upload Flow:**
```
1. POST /media/upload/init
   → Returns presigned URL for MinIO

2. Client uploads directly to MinIO
   PUT https://files.gomin.com/signed-url

3. POST /media/upload/complete
   → Validates file, queues processing

4. Worker processes file (async)
   → Virus scan, thumbnail, metadata
```

**API Endpoints:**
```
POST   /media/upload/init
POST   /media/upload/complete
GET    /media/:id
DELETE /media/:id
GET    /media/:id/metadata
```

**gRPC Services:**
```protobuf
service MediaService {
  rpc InitUpload(InitUploadRequest) returns (UploadResponse);
  rpc CompleteUpload(CompleteUploadRequest) returns (FileResponse);
  rpc GetFileUrl(FileIdRequest) returns (UrlResponse);
  rpc DeleteFile(FileIdRequest) returns (StatusResponse);
}
```

**MinIO Bucket Structure:**
```
avatars/
images/
  ├── original/
  └── thumbnails/
videos/
  ├── original/
  └── transcoded/
documents/
voice/
```

**Database Schema:**
```sql
media_files (
  id, type, original_name, mime_type, size,
  storage_path, thumbnail_path,
  uploaded_by, message_id, chat_id,
  status, metadata jsonb, created_at
)
```

**File Validation Layers:**
1. Size & type validation at init
2. Presigned URL with Content-Type restriction
3. Magic bytes detection at complete
4. Async virus scan (ClamAV)
5. File structure validation
6. EXIF data removal

---

### 4. Notification Service

**Responsibilities:**
- Push notifications (FCM for Android, APNS for iOS)
- Email notifications
- In-app notifications
- Notification preferences management

**API Endpoints:**
```
POST   /notifications/device-token
GET    /notifications
PUT    /notifications/:id/read
GET    /notifications/preferences
PUT    /notifications/preferences
```

**gRPC Services:**
```protobuf
service NotificationService {
  rpc SendNotification(NotificationRequest) returns (StatusResponse);
  rpc GetNotifications(UserIdRequest) returns (NotificationsResponse);
  rpc UpdatePreferences(PreferencesRequest) returns (StatusResponse);
  rpc RegisterDevice(DeviceRequest) returns (StatusResponse);
}
```

**Database Schema:**
```sql
notifications (
  id, user_id, type, title, body,
  data jsonb, read, created_at
)
notification_preferences (
  user_id, push_enabled, email_enabled,
  muted_chats uuid[]
)
device_tokens (user_id, token, platform, device_info)
```

---

## 🔒 Security

### End-to-end encryption (E2EE) model

This section describes the cryptography and data model the platform targets. **Message payloads and per-message keys live in the Communication service** (not implemented in this repo yet). The **Auth service** stores user identity material needed for E2EE and session management.

#### User key material (Auth service / client)

| Data | Server | Client only |
|------|--------|-------------|
| RSA public key (e.g. SPKI, base64) | Stored; readable by authenticated services | — |
| RSA private key (plaintext) | Never | After unlock: memory / IndexedDB |
| Encrypted private key + AES-GCM metadata | Stored (`encryptedPrivateKey`, `encryptionIv`, `encryptionAuthTag`) | — |
| PBKDF2/Argon2 salt for wrapping the private key | Stored (`encryptionSalt`) | — |
| Account password | Never stored in plaintext | User entry; used locally to derive the wrap key and sent over TLS only for verification |

**Password has two independent roles:**

1. **Authentication:** the server stores an **Argon2** hash of the password (separate from the E2EE salt). Login compares the password to this hash over HTTPS.
2. **Private key wrapping:** the client derives a symmetric key with **PBKDF2 (or Argon2) + `encryptionSalt`**, then **AES-256-GCM** decrypts `encryptedPrivateKey`. That salt is not the same as the Argon2 salt used for `passwordHash`.

**Registration (client):** generate RSA-2048 (or agreed size); wrap `privateKey` with AES-GCM using a key derived from the password; upload `publicKey`, ciphertext, salt, IV, auth tag. Never send the raw private key or plaintext password except the password over TLS for hashing.

**Login:** after password verification, the Auth service returns the E2EE bundle so the client can unlock the private key locally. **Multi-device** uses the same encrypted blob from the server and the same account password on each device; no extra sync protocol is required for the same user account.

**gRPC (Auth):** `Login` / `Register` return session tokens; `Login` includes `e2eeKeys` when the bundle is complete. `GetUserPublicKey` returns another user’s public key for encrypting message keys (callers pass a valid `sessionToken`). `ChangePassword` updates the Argon2 password hash and **replaces** the stored E2EE bundle (client must re-wrap the private key with a new key derived from the new password; RSA public key can stay the same).

#### Hybrid encryption for messages (Communication service — planned)

RSA-2048 (OAEP) encrypts at most ~190 bytes per operation, so **message bodies are not RSA-encrypted**. The intended pattern matches TLS/PGP-style hybrid encryption:

1. Per message: random **AES-256** key + **AES-GCM** for `encryptedContent` (with IV + auth tag).
2. That AES key is encrypted for each recipient with **RSA-OAEP** using each recipient’s **public** key.
3. **Direct chat:** two `message_keys` rows (sender and recipient). **Group chat:** N rows for N members; one `messages` row, N wrapped keys.

**Scaling groups:** wrapping the AES key per member is **O(N) RSA operations per message**, which does not scale to very large groups. Production messengers (e.g. Signal/WhatsApp-style **sender keys**) reduce send cost by distributing a symmetric key to members once and rotating on membership changes. Gomin may use **per-message wrapping for small groups** and **sender keys for large groups** as a product decision.

#### Sender keys (group chats, design)

This is **not** “one admin generates a key and everyone derives the rest from it.” Each **sender** has their **own** sender key material. Everyone else stores a local copy of **each participant’s** chain state so they can decrypt that sender’s messages.

**Per sender**

- Alice encrypts her traffic with **her** sender chain (`senderKey` / chain state for Alice).
- Bob encrypts with **his** chain.
- Vasyl encrypts with **his** chain.

So there is no single shared chain for the whole group; there are **parallel chains**, one logical stream per sender.

**Distributing a sender key (one-time, pairwise RSA)**

When Alice joins or creates a group, she generates her sender key (random material + chain state as defined by the chosen protocol, e.g. Signal-style sender-key derivation). She must give **her** key to Bob and Vasyl **confidentially**:

- `RSA-OAEP(senderKey_payload, publicKey_bob)` → to Bob  
- `RSA-OAEP(senderKey_payload, publicKey_vasyl)` → to Vasyl  

Bob and Vasyl do the same for their peers. The server may **relay** these blobs but cannot decrypt them without private keys.

**Sending a normal message**

- Alice advances **her** chain to derive a **message key**, encrypts the plaintext with **AES-GCM** (or the agreed AEAD), uploads **one** ciphertext blob to the server.
- The server fans out the **same** blob to all members (no per-member RSA on each message).
- Recipients who have Alice’s sender state locally derive the **same** message key from the **same** chain step (deterministic KDF/HMAC chain), then decrypt.

**Chain / “next keys”**

Implementations use a **KDF chain** (conceptually: derive a message key from the current chain step, then ratchet the chain forward). Sender and receivers stay in sync because the derivation is deterministic **as long as** they process messages in a consistent order for **that sender’s** stream.

**Forward secrecy (per message key)**

Past message keys are discarded after use; compromising today’s chain state should not recover older plaintexts (exact properties depend on the ratchet design—Signal’s sender keys document the intended guarantees).

**Concurrency and ordering**

- **Two different people** send at the same time: **no conflict**—they use **different** sender chains and different message keys.
- **The same person** sends two messages quickly and they **arrive out of order**: recipients may see message with **iteration / counter** `6` before `5`. Real protocols attach metadata (e.g. `distributionId`, chain step, **message counter / iteration**) so the receiver can:
  - advance the chain forward and **buffer** skipped message keys, or
  - delay decrypt until the missing index arrives,

so decryption stays consistent with the sender’s chain. (Signal uses explicit counters/skipping logic in the sender-key message format.)

**Removing a member**

A removed user must not be able to derive **future** keys. You **do not** only “continue the same chain” if they could have observed prior state. Typically each remaining member generates **new** random sender key material (**v2**), redistributes it via **RSA pairwise among remaining members**, and **stops using v1** for new traffic. The removed user keeps old ciphertext but cannot decrypt new messages.

#### Sender key distribution — transport (Communication service — planned)

Key distribution is **session-oriented and often real-time** (push to online clients, queue for offline). A plain **request/response HTTP** handler alone is a poor fit for “everyone must receive key updates quickly”; the natural options in a NestJS stack are:

- **WebSocket gateway** (e.g. namespace `/keys` or under the main chat socket): events such as `distribute_sender_key` (payload: `groupId`, `recipientId`, `encryptedSenderKey`), and `sender_key_received` on the recipient; **or**
- **gRPC streaming** / long-lived channel from Communication service to clients (mobile/web may still prefer WebSockets).

The server may **persist pending** encrypted blobs (e.g. Redis + DB) keyed by `recipientId` + `groupId` so offline users fetch them on reconnect (`fetch_pending_keys`-style). The service only ever stores **RSA ciphertext**; it never holds users’ private keys.

#### Group membership and keys (Communication service — planned)

- **Add member:** existing members (or an admin) decrypt their copy of the message key (with their private key) and encrypt it for the new member’s public key; batch-insert new `message_keys`. Optionally limit history (e.g. last N messages) or use `canReadFrom` / `joinedAt` so the server only exposes keys for allowed messages.
- **Remove member:** delete that user’s `message_keys` rows; bump **`keyVersion`** on the chat; new messages use the new version so the server can **omit** wrapped keys for removed users.

#### Authentication & Authorization

- **JWT-based authentication**
- Access tokens (15 min expiry)
- Refresh tokens (7 days expiry)
- Token stored in Redis with TTL
- Role-based access control (RBAC)

### API Security

- Rate limiting (Kong/Traefik)
- CORS configuration
- Input validation (class-validator)
- SQL injection prevention (Prisma/parameterized queries)
- XSS protection

### File Upload Security

1. Presigned URLs (15 min expiry)
2. Size limits (100MB per file)
3. MIME type validation
4. Magic bytes detection
5. Antivirus scanning (ClamAV)
6. EXIF data removal

---

## ☁️ Infrastructure

### Kubernetes Deployment

**Namespace Structure:**
```
gomin-prod
  ├── identity-service
  ├── communication-service
  ├── media-service
  ├── notification-service
  ├── postgresql
  ├── redis
  ├── rabbitmq
  ├── minio
  ├── elasticsearch
  └── monitoring
```

**Service Replicas (Production):**
```yaml
Identity Service:      3-5 pods
Communication Service: 5-10 pods (high traffic)
Media Service:         3-5 pods + workers
Notification Service:  3-5 pods
```

**Horizontal Pod Autoscaler (HPA):**
```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Ingress Configuration
```yaml
# API Gateway
api.gomin.com       → API Gateway → Microservices

# Direct MinIO access (bypass gateway for files)
files.gomin.com     → MinIO (direct upload/download)

# WebSocket
ws.gomin.com        → Communication Service (WebSocket gateway)
```

### Database Scaling

**PostgreSQL:**
- Primary-Replica setup
- Read replicas for queries
- Connection pooling (PgBouncer)
- Table partitioning for `messages` table

**Redis:**
- Redis Cluster (3 master + 3 replica)
- Pub/Sub for WebSocket scaling

**MinIO:**
- Distributed mode (4+ nodes)
- Erasure coding for data redundancy

---

## 📊 Data Flow Examples

### 1. Send Message with File
```
┌────────┐                                          ┌──────────────┐
│ Client │                                          │Communication │
└───┬────┘                                          │   Service    │
    │                                               └──────┬───────┘
    │ 1. POST /media/upload/init                          │
    │    { fileName, size, mimeType, chatId }             │
    ├────────────────────────────────────────────────┐    │
    │                                           ┌────▼────▼───┐
    │                                           │    Media    │
    │                                           │   Service   │
    │                                           └────┬────────┘
    │ 2. Return signed URL                           │
    │    { fileId, uploadUrl, expiresIn: 900 }       │
    │<───────────────────────────────────────────────┤
    │                                                │
    │ 3. PUT uploadUrl (direct to MinIO)             │
    │─────────────────────────┐                      │
    │                    ┌────▼─────┐                │
    │                    │  MinIO   │                │
    │                    └──────────┘                │
    │                                                │
    │ 4. POST /media/upload/complete                 │
    │    { fileId }                                  │
    ├────────────────────────────────────────────────┤
    │                                           ┌────▼────────┐
    │                                           │    Media    │
    │                                           │   Service   │
    │                                           │ - Validate  │
    │                                           │ - Queue job │
    │                                           └─────────────┘
    │ 5. Return { fileId, url }                      │
    │<───────────────────────────────────────────────┤
    │                                                │
    │ 6. POST /messages                              │
    │    { chatId, text, fileId }                    │
    ├───────────────────────────────────────────────>│
    │                                          ┌─────▼────────┐
    │                                          │Communication │
    │                                          │   Service    │
    │                                          │ - Save msg   │
    │                                          │ - Notify     │
    │                                          └──────────────┘
```

### 2. User Authentication
```
┌────────┐                                    ┌──────────────┐
│ Client │                                    │   Identity   │
└───┬────┘                                    │   Service    │
    │                                         └──────┬───────┘
    │ 1. POST /auth/login                            │
    │    { email, password }                         │
    ├───────────────────────────────────────────────>│
    │                                                │
    │                                         - Verify password
    │                                         - Generate tokens
    │                                         - Save session (Redis)
    │                                                │
    │ 2. Return tokens + user                        │
    │    {                                           │
    │      accessToken: "eyJhbG...",                 │
    │      refreshToken: "eyJhbG...",                │
    │      user: {...}                               │
    │    }                                           │
    │<───────────────────────────────────────────────┤
    │                                                │
    │ 3. Subsequent requests                         │
    │    Authorization: Bearer eyJhbG...             │
    ├───────────────────────────────┐                │
    │                          ┌────▼─────┐          │
    │                          │   API    │          │
    │                          │ Gateway  │          │
    │                          └────┬─────┘          │
    │                               │                │
    │                               │ Validate token (gRPC)
    │                               ├───────────────>│
    │                               │                │
    │                               │ Return user context
    │                               │<───────────────┤
    │                               │                │
    │                          Add X-User-Id header  │
    │                               │                │
    │                          Forward to service    │
```

### 3. Real-time Message Delivery
```
┌─────────┐                    ┌──────────────┐                    ┌─────────┐
│ Alice   │                    │Communication │                    │   Bob   │
│ Client  │                    │   Service    │                    │ Client  │
└────┬────┘                    └──────┬───────┘                    └────┬────┘
     │                                │                                  │
     │ WebSocket connection           │           WebSocket connection   │
     │<──────────────────────────────>│<─────────────────────────────────>│
     │                                │                                  │
     │ 1. Send message                │                                  │
     │ { type: 'message.send',        │                                  │
     │   payload: {...} }             │                                  │
     ├───────────────────────────────>│                                  │
     │                                │                                  │
     │                         - Save to DB                              │
     │                         - Publish to Redis Pub/Sub               │
     │                                │                                  │
     │                                │ 2. Broadcast via Redis Pub/Sub   │
     │                                │────────────────┐                 │
     │                                │                │                 │
     │                                │<───────────────┘                 │
     │                                │                                  │
     │                                │ 3. Send to Bob                   │
     │                                │ { type: 'message.new',           │
     │                                │   payload: {...} }               │
     │                                ├─────────────────────────────────>│
     │                                │                                  │
     │                                │ 4. Bob sends read receipt        │
     │                                │<─────────────────────────────────┤
     │                                │                                  │
     │ 5. Notify Alice                │                                  │
     │ { type: 'message.read' }       │                                  │
     │<───────────────────────────────┤                                  │
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- Kubernetes (Minikube or cloud provider)
- PostgreSQL 15+
- Redis 7+
- MinIO

### Installation
```bash
# Clone repository
git clone https://github.com/Dmutre/Gomin.git
cd Gomin

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gomin
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

### Development
```bash
# Run all services
pnpm nx run-many --target=serve --all

# Run specific service
pnpm nx serve identity-service
pnpm nx serve communication-service
pnpm nx serve media-service
pnpm nx serve notification-service

# Build all services
pnpm nx run-many --target=build --all

# Run tests
pnpm nx test identity-service

# Lint
pnpm nx lint identity-service

# View dependency graph
pnpm nx graph
```

### Docker Compose (Local Development)
```bash
# Start infrastructure services
docker-compose up -d postgres redis rabbitmq minio elasticsearch

# Check services
docker-compose ps

# View logs
docker-compose logs -f
```

### Kubernetes Deployment
```bash
# Create namespace
kubectl create namespace gomin-prod

# Deploy services
kubectl apply -f k8s/

# Check pods
kubectl get pods -n gomin-prod

# View logs
kubectl logs -f deployment/identity-service -n gomin-prod

# Port forward for testing
kubectl port-forward svc/api-gateway 8080:80 -n gomin-prod
```

---

## 📈 Monitoring & Observability

### Metrics (Prometheus + Grafana)

**Key Metrics:**
- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- WebSocket connections count
- Message throughput
- Database query performance
- Cache hit rate
- Queue length

**Grafana Dashboards:**
- Service health overview
- Database performance
- Message delivery metrics
- File upload statistics
- User activity

### Tracing (Jaeger)

Distributed tracing across services:
```
Client Request
  └─ API Gateway (10ms)
      └─ Identity Service: ValidateToken (5ms)
      └─ Communication Service: SendMessage (50ms)
          └─ Media Service: GetFileUrl (20ms)
          └─ RabbitMQ: PublishEvent (10ms)
          └─ PostgreSQL: InsertMessage (15ms)
```

### Logging (ELK Stack)

Centralized logging with structured logs:
```json
{
  "timestamp": "2026-02-12T10:30:00Z",
  "level": "info",
  "service": "communication-service",
  "traceId": "abc123",
  "userId": "user-456",
  "action": "message.sent",
  "chatId": "chat-789",
  "duration": 45
}
```

---

## 📝 API Documentation

API documentation available at:
- Swagger UI: `http://api.gomin.com/docs`
- Postman Collection: `/docs/postman`
- gRPC Proto files: `/libs/shared/proto`

---

## 🧪 Testing
```bash
# Unit tests
pnpm nx test identity-service

# E2E tests
pnpm nx e2e identity-service-e2e

# Integration tests
pnpm nx test:integration communication-service

# Load testing (k6)
k6 run tests/load/message-send.js
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project was developed as a **bachelor diploma work** and is released as an **open-source** project.

---

## 👥 Authors

- **Dmytro** - *Initial work*

---

## 🙏 Acknowledgments

- Signal Protocol for E2EE inspiration
- NestJS community
- Kubernetes documentation

---

## 📞 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for high-load messaging**
