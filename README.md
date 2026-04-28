# Gomin — Secure Messenger Platform

A scalable, End-to-End encrypted messenger built on NestJS microservices.
Developed as a **bachelor diploma project**, released as open-source.

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Security](#security)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
  - [First-time cluster setup](#first-time-cluster-setup)
  - [CI/CD ServiceAccount](#cicd-serviceaccount)
  - [GitHub Actions](#cicd--github-actions)

---

## Architecture

```
┌──────────────────────────────────────────────┐
│            CLIENT (Web / Mobile)             │
└───────────────────┬──────────────────────────┘
                    │ HTTPS / WSS
┌───────────────────▼──────────────────────────┐
│         Traefik Ingress  (TLS termination)   │
└───────┬───────────────────────────┬──────────┘
        │                           │
┌───────▼──────────┐   ┌────────────▼──────────┐
│   API Gateway    │   │      Web Frontend     │
│  HTTP + Socket.IO│   │  (Vite + React + E2EE)│
└──┬────────────┬──┘   └───────────────────────┘
   │ gRPC       │ gRPC
┌──▼──────┐  ┌──▼────────────────────┐
│  Auth   │  │  Communication Service│
│ Service │  │  (chats, messages,    │
│         │  │   sender keys)        │
└──┬──────┘  └──┬────────────────────┘
   │             │
┌──▼─────────────▼──────────────────────────────┐
│                  PostgreSQL                   │
├───────────────────────────────────────────────┤
│  auth DB: users, sessions, service_identities │
│  comm DB: chats, messages, sender_keys        │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│                    Redis                      │
│  WebSocket pub/sub · session cache            │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│           Observability (gomin-monitoring)    │
│  OTel Collector → Prometheus / Loki / Tempo   │
│                   Grafana                     │
└───────────────────────────────────────────────┘
```

### Services

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 3000 (HTTP/WS) | HTTP routing, WebSocket, session auth |
| `auth` | 5000 (gRPC) | Registration, login, JWT, sessions, E2EE key storage |
| `communication-service` | 5001 (gRPC) | Chats, messages, reactions, sender keys |

---

## Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| **Node.js 22 + NestJS** | All services |
| **TypeScript** | Type safety across monorepo |
| **gRPC** (`@nestjs/microservices`) | Inter-service communication |
| **Knex** | Query builder + migrations |
| **PostgreSQL** | Primary database |
| **Redis** | WebSocket pub/sub, session cache |
| **Socket.IO** | Real-time WebSocket gateway |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Kubernetes (k3s)** | Container orchestration |
| **Helm** | Kubernetes package manager |
| **Traefik** | Ingress controller (built into k3s) |
| **cert-manager** | Automatic TLS via Let's Encrypt |
| **MinIO** | S3-compatible object storage |

### Observability

| Technology | Purpose |
|---|---|
| **OpenTelemetry Collector** | Telemetry aggregation (traces, logs, metrics) |
| **Prometheus** | Metrics storage |
| **Loki** | Log storage |
| **Tempo** | Distributed tracing |
| **Grafana** | Dashboards (`http://grafana.84.247.133.45.nip.io`) |

### Frontend

| Technology | Purpose |
|---|---|
| **Vite + React** | Web client |
| **Web Crypto API** | Client-side E2EE |

---

## Security

Security is layered across transport, authentication, authorization, and message encryption.

### 1. Transport Security (TLS)

All external traffic is encrypted via **HTTPS/WSS**. TLS certificates are issued automatically by **Let's Encrypt** and managed by `cert-manager`:

1. `cert-manager` watches Ingress annotations (`cert-manager.io/cluster-issuer: letsencrypt-prod`)
2. Performs **ACME HTTP-01 challenge** — creates a temporary Pod + Ingress to prove domain ownership
3. Stores the issued certificate as a Kubernetes Secret (`api-gateway-tls`, `web-tls`)
4. **Traefik** reads those Secrets and terminates TLS at the edge

Internal service-to-service traffic travels over the cluster network (no public exposure). gRPC between services is unencrypted within the cluster but isolated by Kubernetes network policies and namespaces.

### 2. User Authentication

**Registration:**
- Password is hashed with **Argon2id** — never stored in plaintext
- Client generates an **RSA-2048 key pair** locally
- Private key is wrapped with **AES-256-GCM** using a key derived from the password via **PBKDF2 + unique salt**
- Server stores: `publicKey`, `encryptedPrivateKey`, `encryptionIv`, `encryptionAuthTag`, `encryptionSalt`
- Server **never sees the plaintext private key**

**Login:**
- Server verifies password against the Argon2 hash
- Returns a **session token** (opaque, stored in DB + Redis) and the encrypted E2EE bundle
- Client decrypts the private key locally using the password

**Sessions:**
- Session token is sent as `Authorization: Bearer <token>` on every HTTP request
- `SessionGuard` in `api-gateway` validates the token via gRPC call to `auth`
- WebSocket connections authenticate via `?token=<sessionToken>` at handshake time (`WsSessionGuard`)

### 3. Service-to-Service Authentication

Every gRPC call between services is authenticated by `MicroserviceIdentityGuard`:

```
api-gateway → auth service:
  1. api-gateway holds a SERVICE_SECRET configured via Kubernetes Secret
  2. Calls AuthenticateServiceIdentity(serviceName, serviceSecret) → gets a JWT (RS256)
  3. Attaches the JWT as metadata on every subsequent gRPC call
  4. auth validates the JWT on each call via MicroserviceIdentityGuard + RequirePermission
```

Each service has a fixed set of **permissions** (e.g. `SESSIONS_READ`, `USERS_WRITE`) defined in the database. The guard checks both token validity and permission presence. A compromised service can only call endpoints it is explicitly permitted to.

### 4. CORS

HTTP and WebSocket CORS are both restricted to the frontend origin via the `CORS_ORIGIN` environment variable (stored in the `api-gateway-secret` Kubernetes Secret):

```
CORS_ORIGIN=https://app.84.247.133.45.nip.io
```

`app.enableCors()` and Socket.IO's `createIOServer` both read this value. Requests from any other origin are rejected by the browser before they reach the server.

### 5. Input Validation

All HTTP request bodies are validated globally by NestJS `ValidationPipe`:

```typescript
new ValidationPipe({
  whitelist: true,           // strips fields not in the DTO
  forbidNonWhitelisted: true,// rejects requests with unknown fields
  transform: true,           // coerces types automatically
})
```

This prevents mass-assignment attacks and ensures only declared fields reach the service layer.

### 6. End-to-End Encryption (E2EE)

Messages are encrypted on the client and the server stores only ciphertext. Two schemes are used depending on group size:

**Direct / small group — per-message hybrid encryption:**

```
1. Client generates a random AES-256 key for the message
2. Encrypts the message body with AES-GCM  → encryptedContent + iv + authTag
3. Wraps the AES key with each recipient's RSA-2048 public key (RSA-OAEP)
4. Uploads: one ciphertext blob + N wrapped keys (one per recipient)
```

**Large groups — Sender Keys:**

```
1. Each sender generates their own sender key (random chain material)
2. Distributes it to each group member via RSA-OAEP (pairwise, one-time)
3. For each message: derives a message key from the KDF chain, encrypts with AES-GCM
4. Uploads one ciphertext blob; all recipients derive the same key locally
   → O(1) ciphertext per message instead of O(N) RSA operations
```

Key rotation on member removal: remaining members generate new sender key material and redistribute it, making future messages unreadable to the removed user.

### 7. Kubernetes Secrets Management

All sensitive values (passwords, tokens, DB URLs) are stored in Kubernetes Secrets — never in git:

```
api-gateway-secret   → CORS_ORIGIN, SERVICE_SECRET, REDIS_PASSWORD, ...
auth-secret          → JWT_SIGNING_KEYS, DATABASE_URL, ...
communication-service-secret → DATABASE_URL, SERVICE_SECRET, ...
redis-secret         → REDIS_PASSWORD
minio-secret         → rootUser, rootPassword
```

Pods mount secrets via `envFrom.secretRef` — the application reads them as environment variables without any knowledge of the secret layer.

### 8. CI/CD Least-Privilege

The GitHub Actions ServiceAccount (`github-actions`) has **write access only to `gomin-apps` and `gomin-infra`**. It cannot read or modify `kube-system`, create namespaces, or access any cluster-wide resource. See the [CI/CD ServiceAccount](#cicd-serviceaccount) section.

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for local infrastructure)
- PostgreSQL 15+, Redis 7+

### Install

```bash
git clone https://github.com/Dmutre/Gomin.git
cd Gomin
pnpm install
```

### Local development

```bash
# Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# Run a service
pnpm nx serve api-gateway
pnpm nx serve auth
pnpm nx serve communication-service

# Build all
pnpm nx run-many --target=build --all

# Lint
pnpm nx run-many --target=lint --all

# Dependency graph
pnpm nx graph
```

### Key environment variables (per service)

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | auth, communication-service | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | all | Redis connection |
| `JWT_SIGNING_KEYS` | auth | JSON array of RSA key pairs |
| `GRPC_PORT` | auth, communication-service | gRPC listen port |
| `AUTH_SERVICE_URL` | api-gateway, communication-service | gRPC address of auth |
| `COMMUNICATION_SERVICE_URL` | api-gateway | gRPC address of communication-service |
| `SERVICE_NAME` / `SERVICE_SECRET` | api-gateway, communication-service | Inter-service auth identity |
| `CORS_ORIGIN` | api-gateway | Allowed frontend origin (e.g. `https://app.example.com`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | all | OTel Collector gRPC endpoint |

---

## Deployment

### Helm chart structure

```
charts/
  platform/               # Cluster-level: namespaces
  infra/                  # Redis + MinIO
  api-gateway/            # HTTP / WebSocket gateway
  auth/                   # Auth gRPC microservice + migrations
  communication-service/  # Messaging gRPC microservice + migrations
  web/                    # Static frontend
  monitoring/             # Prometheus, Loki, Tempo, Grafana, OTel Collector
```

**Namespaces:**

| Namespace | Contents |
|---|---|
| `gomin-infra` | Redis, MinIO |
| `gomin-apps` | api-gateway, auth, communication-service, web |
| `gomin-monitoring` | Prometheus, Grafana, Loki, Tempo, OTel Collector |

**Live endpoints:**

| Service | URL |
|---|---|
| API Gateway | `https://api.84.247.133.45.nip.io` |
| Web Frontend | `https://app.84.247.133.45.nip.io` |
| Grafana | `http://grafana.84.247.133.45.nip.io` |
| Swagger | `https://api.84.247.133.45.nip.io/docs` |

---

### First-time cluster setup

**1. Bootstrap namespaces + CI/CD ServiceAccount:**
```bash
kubectl apply -f k8s/bootstrap/ci-rbac.yaml
```

Creates: `gomin-apps`, `gomin-infra`, `ServiceAccount github-actions`, RBAC, long-lived token.

**2. Install metrics-server** (required for HPA):
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**3. Create all secrets interactively** (passwords are never written to disk or git):
```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

Prompts for: Redis password, MinIO credentials, PostgreSQL URLs, JWT keys, service secrets, CORS origin. Re-running updates existing secrets safely (idempotent).

**4. Deploy namespaces + infrastructure:**
```bash
helm upgrade --install platform ./charts/platform
helm upgrade --install infra    ./charts/infra --namespace gomin-infra
```

**5. Deploy application services:**
```bash
helm upgrade --install auth                  ./charts/auth                  --namespace gomin-apps
helm upgrade --install communication-service ./charts/communication-service --namespace gomin-apps
helm upgrade --install api-gateway           ./charts/api-gateway           --namespace gomin-apps
helm upgrade --install web                   ./charts/web                   --namespace gomin-apps
```

**6. (Optional) Deploy monitoring stack:**
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana               https://grafana.github.io/helm-charts
helm repo add open-telemetry        https://open-telemetry.github.io/opentelemetry-helm-charts
helm dependency update charts/monitoring
helm upgrade --install monitoring ./charts/monitoring --namespace gomin-monitoring \
  --set kube-prometheus-stack.grafana.adminPassword="<password>"
```

---

### CI/CD ServiceAccount

GitHub Actions deploys using `github-actions` ServiceAccount — write access **only** to `gomin-apps` and `gomin-infra`.

The manifest is at [`k8s/bootstrap/ci-rbac.yaml`](k8s/bootstrap/ci-rbac.yaml). It creates:
- `ServiceAccount` `github-actions` in `gomin-apps`
- `ClusterRole` `gomin-deployer` — minimum Helm permissions (CRUD on deployments, services, secrets, jobs, HPA, ingresses)
- `RoleBinding` in both `gomin-apps` and `gomin-infra`
- `ClusterRole` `gomin-crd-manager` + `ClusterRoleBinding` — CRD and cluster-scoped resource access
- A long-lived `Secret` token (required since Kubernetes 1.24)

#### Generate the restricted kubeconfig

```bash
chmod +x k8s/bootstrap/generate-ci-kubeconfig.sh
./k8s/bootstrap/generate-ci-kubeconfig.sh "<VDS_IP>" ci-kubeconfig.yaml
cat ci-kubeconfig.yaml   # copy output
rm  ci-kubeconfig.yaml   # delete locally
```

Add to **GitHub → Settings → Secrets → Actions**:

| Name | Value |
|---|---|
| `KUBECONFIG` | Paste the kubeconfig content |

#### Verify least-privilege

```bash
# Allowed
kubectl auth can-i create deployments \
  --as=system:serviceaccount:gomin-apps:github-actions -n gomin-apps   # yes
kubectl auth can-i create deployments \
  --as=system:serviceaccount:gomin-apps:github-actions -n gomin-infra  # yes

# Denied
kubectl auth can-i delete namespaces \
  --as=system:serviceaccount:gomin-apps:github-actions                 # no
kubectl auth can-i get secrets \
  --as=system:serviceaccount:gomin-apps:github-actions -n kube-system  # no
```

---

### CI/CD — GitHub Actions

**Workflow:** `.github/workflows/build-and-deploy.yml`

Go to **Actions → Build & Deploy → Run workflow**:

| Input | Description |
|---|---|
| `version` | Image tag (e.g. `v1.2.0`). Empty = use `package.json` version. |
| `Build <service>` | Checkbox per service |
| `Deploy to Kubernetes` | Run `helm upgrade` after build |
| `Run DB migrations` | Run Knex migrations before deploy |

#### Pipeline

```
setup   → compute build + migration matrices

build   → parallel per service:
          docker build → ghcr.io/<owner>/gomin-<service>:<version>

migrate → (if Deploy + Run migrations checked)
          kubectl apply Job → knex migrate:latest
          kubectl wait  --for=condition=complete --timeout=5m
          Job auto-deletes after 10 min

deploy  → parallel per service (only if build + migrate succeeded):
          helm upgrade --install --atomic --timeout 5m
          auto-rollback on failure
```

#### Migration table

| Deploy | Run migrations | Service selected | Result |
|---|---|---|---|
| ✅ | ✅ | ✅ | migrate → deploy |
| ✅ | ✅ | ❌ | skip migrate → deploy |
| ✅ | ❌ | ✅ | skip migrate → deploy (schema must be current) |
| ❌ | any | any | build + push only |

#### Update strategy

All deployments use `RollingUpdate` with `maxUnavailable: 0`, `maxSurge: 1` — new pod must pass readiness before old one terminates. `--atomic` auto-reverts on failure.

---

### Useful commands

```bash
# Pod status
kubectl get pods -n gomin-apps
kubectl get pods -n gomin-infra

# Logs
kubectl logs -f deployment/api-gateway -n gomin-apps

# HPA status
kubectl get hpa -n gomin-apps

# Helm history / rollback
helm history auth -n gomin-apps
helm rollback  auth -n gomin-apps

# Port-forward MinIO console
kubectl port-forward -n gomin-infra svc/minio 9001:9001

# Manual migration
kubectl create job --from=cronjob/auth-migrate auth-migrate-manual -n gomin-apps
kubectl wait --for=condition=complete job/auth-migrate-manual -n gomin-apps --timeout=120s
```

---

## License

Released as open-source. Developed as a bachelor diploma project.

## Authors

- **Dmytro Lesko** — initial work

## Acknowledgments

- Signal Protocol — E2EE design inspiration
- NestJS, Kubernetes, Let's Encrypt communities
