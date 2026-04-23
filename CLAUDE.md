# Gomin — Claude Code Context

## Project

Bachelor diploma project. NX monorepo (pnpm), NestJS microservices, E2EE messaging platform.

**Services**: `apps/api-gateway` (HTTP/WS), `apps/auth`, `apps/communication-service`  
**Libs**: `@gomin/grpc`, `@gomin/app`, `@gomin/database`, `@gomin/logger`, `@gomin/service-identity`  
**Transport**: gRPC via `@nestjs/microservices`, Knex + PostgreSQL, Redis pub/sub for WebSocket scaling

## Kubernetes Cluster

- **Type**: k3s, single node
- **Ingress**: Traefik — `ingressClassName: traefik` (NOT nginx)
- **LoadBalancer IP**: check with `kubectl get svc -n kube-system traefik`
- **DNS**: if no domain, use `nip.io` — e.g. `api.<EXTERNAL-IP>.nip.io`
- kubectl is available in Claude sessions if the user has added the cluster

### Namespaces

| Namespace | Contents |
|---|---|
| `gomin-apps` | api-gateway, auth, communication-service |
| `gomin-infra` | Redis, MinIO |
| `gomin-monitoring` | Prometheus, Loki, Tempo, Grafana, OTel Collector |
| `cert-manager` | cert-manager (TLS certificates via Let's Encrypt) |

### Bootstrap

**Step 1** — RBAC + namespaces (apply once on bare cluster before any CI/CD):
```bash
kubectl apply -f k8s/bootstrap/ci-rbac.yaml
```
Creates namespaces (including `cert-manager`), `github-actions` ServiceAccount, and two ClusterRoles:
- `gomin-deployer` (RoleBinding per namespace) — namespaced resources
- `gomin-crd-manager` (ClusterRoleBinding) — cluster-scoped resources + `verbs: ["*"]`

**Step 2** — cert-manager + Let's Encrypt (run once via `Deploy Infrastructure` workflow, tick `deploy_cert_manager`):
Installs cert-manager via Helm and creates a `letsencrypt-prod` ClusterIssuer.
After this, any Ingress with `cert-manager.io/cluster-issuer: letsencrypt-prod` annotation gets a real TLS certificate automatically.

To apply manually instead:
```bash
helm repo add jetstack https://charts.jetstack.io && helm repo update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace --set installCRDs=true
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=webhook \
  -n cert-manager --timeout=120s
kubectl apply -f k8s/bootstrap/cert-manager.yaml
```

**RBAC gotchas:**
- You cannot create a ClusterRole with permissions you don't already hold — including `*` verb (distinct from explicit verb list)
- `resources: ["*"]` does NOT cover subresources — list `*/finalizers` and `*/status` explicitly
- monitoring.coreos.com CRDs need `*/finalizers` and `*/status` with `verbs: ["*"]`

## Helm Charts

```
charts/
  platform/             — namespaces
  infra/                — Redis + MinIO  → namespace: gomin-infra
  api-gateway/          — Deployment, Service, Ingress, HPA
  auth/                 — Deployment, Service, migration Job, HPA
  communication-service/
  monitoring/           — umbrella chart → namespace: gomin-monitoring
```

### Monitoring Stack (`charts/monitoring/`)

Umbrella chart with 4 dependencies: `kube-prometheus-stack`, `loki`, `tempo`, `opentelemetry-collector`.

Deploy:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm dependency update charts/monitoring
helm upgrade --install monitoring ./charts/monitoring --namespace gomin-monitoring \
  --set kube-prometheus-stack.grafana.adminPassword="<password>"
```

Grafana password: `kubectl get secret -n gomin-monitoring monitoring-grafana -o jsonpath="{.data.admin-password}" | base64 -d`

**Signal routing via OTel Collector** (OTLP push from apps):
- Traces → Tempo (`monitoring-tempo:4317`, grpc)
- Logs → Loki (`http://monitoring-loki:3100/otlp`, otlphttp)
- Metrics → Prometheus scrape (`0.0.0.0:8889`)

OTel endpoints for apps: gRPC `monitoring-opentelemetry-collector:4317`, HTTP `4318`

kube-system components disabled (managed cluster): coreDns, kubeControllerManager, kubeScheduler, kubeEtcd, kubeProxy.

### Known Issues & Fixes

**Grafana PVC / init-chown-data Permission Denied**  
Fixed in values: `initChownData.enabled: false` + `securityContext.fsGroup: 472`. kubelet sets PVC ownership natively, no root init container needed.

**Grafana stuck with two pods (RWO PVC + RollingUpdate)**  
Fixed in values: `rollingUpdate: {maxSurge: 0, maxUnavailable: 1}` — old pod terminates before new one starts.

**OTel `loki` exporter removed in newer contrib builds**  
Use `otlphttp/loki` exporter pointing to `http://monitoring-loki:3100/otlp`.

**Helm upgrade PVC race condition**  
If a PVC is manually deleted while Helm upgrade runs concurrently, Helm skips recreation. Fix: `kubectl apply -f` the PVC manually, or wait for full termination before upgrading.

**Swagger shows routes without /api prefix**  
`setGlobalPrefix('api')` must be called before `SwaggerModule.createDocument()`. All gateway routes are under `/api/` prefix.

## Deploy Workflows

- `.github/workflows/build-and-deploy.yml` — CI build + deploy app services
- `.github/workflows/deploy-infra.yml` — manual trigger, deploys Redis/MinIO and/or monitoring stack

## Conventions

- DB types: `*.db.ts`, domain models: `*.domain.model.ts`
- Mappers: static `toDomain` / `toDb` methods
- Auth guard: `MicroserviceIdentityGuard` + `@RequirePermission(...)` on all guarded controllers
- Auth service itself uses `LocalIdentityGuard` (no self-calls to auth)
