# Windows PowerShell: .\run-load-test.ps1
# Override: $env:BASE_URL = 'https://other.api'; .\run-load-test.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not $env:BASE_URL) { $env:BASE_URL = 'https://api.84.247.133.45.nip.io' }
if (-not $env:SETUP_USERS) { $env:SETUP_USERS = '20' }
if (-not $env:MAX_VUS) { $env:MAX_VUS = '20' }
if (-not $env:RAMP_UP) { $env:RAMP_UP = '1m' }
if (-not $env:SUSTAIN) { $env:SUSTAIN = '2m' }
if (-not $env:SPIKE_VUS) { $env:SPIKE_VUS = '50' }
if (-not $env:SPIKE_DUR) { $env:SPIKE_DUR = '1m' }
if (-not $env:MSG_PER_VU) { $env:MSG_PER_VU = '5' }
if (-not $env:MSG_INTERVAL) { $env:MSG_INTERVAL = '2' }

k6 run `
  -e "BASE_URL=$($env:BASE_URL)" `
  -e "SETUP_USERS=$($env:SETUP_USERS)" `
  -e "MAX_VUS=$($env:MAX_VUS)" `
  -e "RAMP_UP=$($env:RAMP_UP)" `
  -e "SUSTAIN=$($env:SUSTAIN)" `
  -e "SPIKE_VUS=$($env:SPIKE_VUS)" `
  -e "SPIKE_DUR=$($env:SPIKE_DUR)" `
  -e "MSG_PER_VU=$($env:MSG_PER_VU)" `
  -e "MSG_INTERVAL=$($env:MSG_INTERVAL)" `
  .\gomin-load-test.js
