#!/usr/bin/env bash
# Build a kubeconfig for GitHub Actions using the github-actions ServiceAccount token.
# Run on a machine with cluster admin kubectl (e.g. your VDS) after:
#   kubectl apply -f k8s/bootstrap/ci-rbac.yaml
#
# Usage:
#   ./k8s/bootstrap/generate-ci-kubeconfig.sh <api-host-or-ip> [output-file]
#   ./k8s/bootstrap/generate-ci-kubeconfig.sh 203.0.113.10 ./ci-kubeconfig.yaml
#
# If the first argument does not start with http(s)://, the API URL is https://<arg>:6443
#
# Env overrides (optional):
#   NAMESPACE          default: gomin-apps
#   TOKEN_SECRET_NAME    default: github-actions-token

set -euo pipefail

NAMESPACE="${NAMESPACE:-gomin-apps}"
TOKEN_SECRET_NAME="${TOKEN_SECRET_NAME:-github-actions-token}"

usage() {
  echo "Usage: $0 <api-server-host-or-ip|full-https-url> [output-file]" >&2
  echo "Example: $0 203.0.113.10 ci-kubeconfig.yaml" >&2
  exit 1
}

API_SERVER_ARG="${1:-}"
OUTPUT="${2:-ci-kubeconfig.yaml}"

if [[ -z "$API_SERVER_ARG" ]]; then
  usage
fi

if [[ "$API_SERVER_ARG" =~ ^https?:// ]]; then
  SERVER="$API_SERVER_ARG"
else
  SERVER="https://${API_SERVER_ARG}:6443"
fi

CA=$(kubectl get secret "$TOKEN_SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.ca\.crt}')
TOKEN=$(kubectl get secret "$TOKEN_SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.token}' | base64 -d)

cat <<EOF >"$OUTPUT"
apiVersion: v1
kind: Config
clusters:
  - name: gomin
    cluster:
      server: ${SERVER}
      certificate-authority-data: ${CA}
users:
  - name: github-actions
    user:
      token: ${TOKEN}
contexts:
  - name: gomin
    context:
      cluster: gomin
      user: github-actions
      namespace: gomin-apps
current-context: gomin
EOF

echo "Wrote kubeconfig to ${OUTPUT}" >&2
echo "Add its contents to GitHub → Settings → Secrets → KUBECONFIG, then remove the file." >&2
