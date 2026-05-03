#!/usr/bin/env bash
# Linux/macOS/Git Bash: chmod +x run-load-test.sh && ./run-load-test.sh
# Override any default: BASE_URL=https://other.api ./run-load-test.sh
set -euo pipefail

cd "$(dirname "$0")"

: "${BASE_URL:=https://api.84.247.133.45.nip.io}"
: "${SETUP_USERS:=20}"
: "${MAX_VUS:=20}"
: "${RAMP_UP:=1m}"
: "${SUSTAIN:=2m}"
: "${SPIKE_VUS:=50}"
: "${SPIKE_DUR:=1m}"
: "${MSG_PER_VU:=5}"
: "${MSG_INTERVAL:=2}"

exec k6 run \
  -e "BASE_URL=${BASE_URL}" \
  -e "SETUP_USERS=${SETUP_USERS}" \
  -e "MAX_VUS=${MAX_VUS}" \
  -e "RAMP_UP=${RAMP_UP}" \
  -e "SUSTAIN=${SUSTAIN}" \
  -e "SPIKE_VUS=${SPIKE_VUS}" \
  -e "SPIKE_DUR=${SPIKE_DUR}" \
  -e "MSG_PER_VU=${MSG_PER_VU}" \
  -e "MSG_INTERVAL=${MSG_INTERVAL}" \
  ./gomin-load-test.js
