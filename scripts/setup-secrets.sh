#!/usr/bin/env bash
# Creates all Kubernetes secrets required by Gomin.
# Safe to re-run — uses apply, so existing secrets are updated.
set -euo pipefail

# ── Helpers ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}  →${NC} $*"; }
success() { echo -e "${GREEN}  ✓${NC} $*"; }
header()  { echo -e "\n${YELLOW}══ $* ══${NC}"; }
die()     { echo -e "${RED}  ✗ $*${NC}" >&2; exit 1; }

# Read a required value; re-prompts if empty
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

# Read a password (hidden input); re-prompts if empty
ask_secret() {
  local prompt="$1" value confirm
  while true; do
    read -rsp "  $prompt: " value; echo
    [ -z "$value" ] && echo -e "${RED}  Password cannot be empty.${NC}" && continue
    read -rsp "  Confirm $prompt: " confirm; echo
    [ "$value" = "$confirm" ] && break
    echo -e "${RED}  Passwords do not match. Try again.${NC}"
  done
  echo "$value"
}

# kubectl create secret ... --dry-run | apply  →  idempotent upsert
apply_secret() {
  local namespace="$1"; shift
  kubectl create secret generic "$@" \
    --namespace "$namespace" \
    --dry-run=client -o yaml \
    | kubectl apply -f - > /dev/null
  success "Secret '${*:0:1}' applied in namespace '$namespace'"
}

ensure_namespace() {
  kubectl get namespace "$1" &>/dev/null \
    || kubectl create namespace "$1" \
    && info "Namespace '$1' ready"
}

# ── Pre-flight ─────────────────────────────────────────────────────────────────

command -v kubectl &>/dev/null || die "kubectl not found in PATH"
kubectl cluster-info &>/dev/null  || die "Cannot reach the cluster. Check your kubeconfig."

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║      Gomin — Secrets Setup           ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"
echo "  This script creates (or updates) all k8s secrets."
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

# ── MinIO ──────────────────────────────────────────────────────────────────────

header "MinIO  (gomin-infra)"
MINIO_USER=$(ask     "Root user" "minioadmin")
MINIO_PASSWORD=$(ask_secret "Root password")

apply_secret gomin-infra minio-secret \
  --from-literal=rootUser="$MINIO_USER" \
  --from-literal=rootPassword="$MINIO_PASSWORD"

# ── Auth service ───────────────────────────────────────────────────────────────

header "Auth service  (gomin-apps)"
AUTH_DB_URL=$(ask     "PostgreSQL URL" "postgres://auth_user:password@postgres:5432/auth_db")
JWT_SECRET=$(ask_secret "JWT secret (min 32 chars)")
AUTH_GRPC_PORT=$(ask  "gRPC port" "5000")

apply_secret gomin-apps auth-secret \
  --from-literal=DATABASE_URL="$AUTH_DB_URL" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=GRPC_PORT="$AUTH_GRPC_PORT"

# ── Communication service ──────────────────────────────────────────────────────

header "Communication service  (gomin-apps)"
COMM_DB_URL=$(ask     "PostgreSQL URL" "postgres://comm_user:password@postgres:5432/comm_db")
COMM_GRPC_PORT=$(ask  "gRPC port" "5001")
MINIO_ENDPOINT=$(ask  "MinIO endpoint" "minio.gomin-infra.svc.cluster.local:9000")

apply_secret gomin-apps communication-service-secret \
  --from-literal=DATABASE_URL="$COMM_DB_URL" \
  --from-literal=GRPC_PORT="$COMM_GRPC_PORT" \
  --from-literal=MINIO_ENDPOINT="$MINIO_ENDPOINT" \
  --from-literal=MINIO_ACCESS_KEY="$MINIO_USER" \
  --from-literal=MINIO_SECRET_KEY="$MINIO_PASSWORD"

# ── API Gateway ────────────────────────────────────────────────────────────────

header "API Gateway  (gomin-apps)"
GW_PORT=$(ask         "HTTP port" "3000")
REDIS_URL="redis://:${REDIS_PASSWORD}@redis.gomin-infra.svc.cluster.local:6379"
info "Redis URL set automatically: $REDIS_URL"

apply_secret gomin-apps api-gateway-secret \
  --from-literal=APP_PORT="$GW_PORT" \
  --from-literal=REDIS_URL="$REDIS_URL" \
  --from-literal=AUTH_GRPC_URL="auth.gomin-apps.svc.cluster.local:${AUTH_GRPC_PORT}" \
  --from-literal=COMM_GRPC_URL="communication-service.gomin-apps.svc.cluster.local:${COMM_GRPC_PORT}"

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
