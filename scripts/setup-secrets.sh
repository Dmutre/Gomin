#!/usr/bin/env bash
# Creates all Kubernetes secrets required by Gomin.
# Safe to re-run — uses --dry-run + apply, so existing secrets are updated.
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}  →${NC} $*"; }
success() { echo -e "${GREEN}  ✓${NC} $*"; }
header()  { echo -e "\n${YELLOW}══ $* ══${NC}"; }
die()     { echo -e "${RED}  ✗ $*${NC}" >&2; exit 1; }

ask() {
  local prompt="$1" default="${2:-}" value
  while true; do
    if [ -n "$default" ]; then
      read -rp "  $prompt [$default]: " value
      value="${value:-$default}"
    else
      read -rp "  $prompt: " value
    fi
    [ -n "$value" ] && break
    echo -e "${RED}  Value cannot be empty.${NC}"
  done
  echo "$value"
}

ask_secret() {
  local prompt="$1" value confirm
  while true; do
    read -rsp "  $prompt: " value; echo
    [ -z "$value" ] && echo -e "${RED}  Cannot be empty.${NC}" && continue
    read -rsp "  Confirm $prompt: " confirm; echo
    [ "$value" = "$confirm" ] && break
    echo -e "${RED}  Values do not match. Try again.${NC}"
  done
  echo "$value"
}

# Idempotent upsert — overwrites existing secret if it exists
apply_secret() {
  local namespace="$1" name="$2"; shift 2
  kubectl create secret generic "$name" \
    --namespace "$namespace" \
    "$@" \
    --dry-run=client -o yaml \
    | kubectl apply -f - > /dev/null
  success "Secret '$name' → namespace '$namespace'"
}

ensure_namespace() {
  kubectl get namespace "$1" &>/dev/null && return
  kubectl create namespace "$1"
  info "Created namespace '$1'"
}

# ── Pre-flight ─────────────────────────────────────────────────────────────────

command -v kubectl &>/dev/null || die "kubectl not found in PATH"
kubectl cluster-info &>/dev/null  || die "Cannot reach the cluster. Check your kubeconfig."

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║      Gomin — Secrets Setup           ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"
echo "  Passwords are never written to disk or git."
echo ""

# ── Namespaces ─────────────────────────────────────────────────────────────────

header "Namespaces"
ensure_namespace gomin-infra
ensure_namespace gomin-apps

# ── Redis ──────────────────────────────────────────────────────────────────────

header "Redis  (gomin-infra)"
REDIS_PASSWORD=$(ask_secret "Redis password")

apply_secret gomin-infra redis-secret \
  --from-literal=password="$REDIS_PASSWORD"

# Redis connection details reused by all app services
REDIS_HOST="redis.gomin-infra.svc.cluster.local"
REDIS_PORT="6379"
info "Redis endpoint: ${REDIS_HOST}:${REDIS_PORT}"

# ── MinIO ──────────────────────────────────────────────────────────────────────

header "MinIO  (gomin-infra)"
MINIO_USER=$(ask     "Root user" "minioadmin")
MINIO_PASSWORD=$(ask_secret "Root password")

apply_secret gomin-infra minio-secret \
  --from-literal=rootUser="$MINIO_USER" \
  --from-literal=rootPassword="$MINIO_PASSWORD"

# ── Auth service ───────────────────────────────────────────────────────────────

header "Auth service  (gomin-apps)"
echo "  JWT_SIGNING_KEYS must be a JSON array:"
echo '  [{"keyId":"key-1","privateKey":"-----BEGIN RSA PRIVATE KEY-----\n...","publicKey":"-----BEGIN PUBLIC KEY-----\n..."}]'
echo "  Generate with: openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt"
echo ""

AUTH_DB_URL=$(ask "DATABASE_URL" "postgres://auth_user:password@postgres:5432/auth_db")
JWT_SIGNING_KEYS=$(ask "JWT_SIGNING_KEYS (JSON)")
AUTH_GRPC_PORT=$(ask "GRPC_PORT" "5000")
AUTH_HOST=$(ask "HOST" "0.0.0.0")

apply_secret gomin-apps auth-secret \
  --from-literal=NODE_ENV="production" \
  --from-literal=DATABASE_URL="$AUTH_DB_URL" \
  --from-literal=JWT_SIGNING_KEYS="$JWT_SIGNING_KEYS" \
  --from-literal=GRPC_PORT="$AUTH_GRPC_PORT" \
  --from-literal=HOST="$AUTH_HOST" \
  --from-literal=REDIS_HOST="$REDIS_HOST" \
  --from-literal=REDIS_PORT="$REDIS_PORT" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD"

AUTH_SERVICE_URL="auth.gomin-apps.svc.cluster.local:${AUTH_GRPC_PORT}"
info "Auth gRPC URL: ${AUTH_SERVICE_URL}"

# ── Communication service ──────────────────────────────────────────────────────

header "Communication service  (gomin-apps)"
COMM_DB_URL=$(ask  "DATABASE_URL" "postgres://comm_user:password@postgres:5432/comm_db")
COMM_SERVICE_SECRET=$(ask_secret "SERVICE_SECRET (inter-service auth token)")
COMM_GRPC_PORT=$(ask "GRPC_PORT" "5001")
COMM_HOST=$(ask "HOST" "0.0.0.0")

apply_secret gomin-apps communication-service-secret \
  --from-literal=NODE_ENV="production" \
  --from-literal=DATABASE_URL="$COMM_DB_URL" \
  --from-literal=SERVICE_SECRET="$COMM_SERVICE_SECRET" \
  --from-literal=GRPC_PORT="$COMM_GRPC_PORT" \
  --from-literal=HOST="$COMM_HOST" \
  --from-literal=AUTH_SERVICE_URL="$AUTH_SERVICE_URL" \
  --from-literal=REDIS_HOST="$REDIS_HOST" \
  --from-literal=REDIS_PORT="$REDIS_PORT" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD"

COMM_SERVICE_URL="communication-service.gomin-apps.svc.cluster.local:${COMM_GRPC_PORT}"
info "Comm gRPC URL: ${COMM_SERVICE_URL}"

# ── API Gateway ────────────────────────────────────────────────────────────────

header "API Gateway  (gomin-apps)"
GW_PORT=$(ask "PORT" "3000")
GW_HOST=$(ask "HOST" "0.0.0.0")
GW_SERVICE_SECRET=$(ask_secret "SERVICE_SECRET (inter-service auth token)")

apply_secret gomin-apps api-gateway-secret \
  --from-literal=NODE_ENV="production" \
  --from-literal=PORT="$GW_PORT" \
  --from-literal=HOST="$GW_HOST" \
  --from-literal=SERVICE_SECRET="$GW_SERVICE_SECRET" \
  --from-literal=AUTH_SERVICE_URL="$AUTH_SERVICE_URL" \
  --from-literal=COMMUNICATION_SERVICE_URL="$COMM_SERVICE_URL" \
  --from-literal=REDIS_HOST="$REDIS_HOST" \
  --from-literal=REDIS_PORT="$REDIS_PORT" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD"

# ── Done ───────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}  All secrets created successfully.${NC}"
echo ""
echo "  Next steps:"
echo "    helm upgrade --install infra    ./charts/infra    --namespace gomin-infra"
echo "    helm upgrade --install auth     ./charts/auth     --namespace gomin-apps"
echo "    helm upgrade --install comm     ./charts/communication-service --namespace gomin-apps"
echo "    helm upgrade --install gateway  ./charts/api-gateway --namespace gomin-apps"
echo ""
