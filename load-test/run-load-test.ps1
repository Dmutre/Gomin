# Windows PowerShell: .\run-load-test.ps1 [small|medium|large]
# Override individual vars: $env:BASE_URL = 'https://other.api'; .\run-load-test.ps1 medium
param([string]$Profile = 'small')

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$envFile = ".\.env.$Profile"
if (Test-Path $envFile) {
    Write-Host "Loading profile: $Profile ($envFile)"
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#=\s]+)\s*=\s*(.*)$') {
            if (-not (Test-Path "env:$($matches[1])")) {
                Set-Item "env:$($matches[1])" $matches[2]
            }
        }
    }
} else {
    Write-Warning "Profile file '$envFile' not found, using defaults"
}

if (-not $env:BASE_URL)      { $env:BASE_URL      = 'https://api.84.247.133.45.nip.io' }
if (-not $env:SETUP_USERS)   { $env:SETUP_USERS   = '60' }
if (-not $env:NUM_CHATS)     { $env:NUM_CHATS      = '3' }
if (-not $env:MAX_VUS)       { $env:MAX_VUS        = '35' }
if (-not $env:RAMP_UP)       { $env:RAMP_UP        = '1m' }
if (-not $env:SUSTAIN)       { $env:SUSTAIN        = '3m' }
if (-not $env:SPIKE_VUS)     { $env:SPIKE_VUS      = '50' }
if (-not $env:SPIKE_DUR)     { $env:SPIKE_DUR      = '1m' }
if (-not $env:MSG_PER_VU)    { $env:MSG_PER_VU     = '5' }
if (-not $env:MSG_INTERVAL)  { $env:MSG_INTERVAL   = '2' }

Write-Host "BASE_URL=$($env:BASE_URL)  VUs=$($env:MAX_VUS)  Users=$($env:SETUP_USERS)  Sustain=$($env:SUSTAIN)"

k6 run `
  -e "BASE_URL=$($env:BASE_URL)" `
  -e "SETUP_USERS=$($env:SETUP_USERS)" `
  -e "NUM_CHATS=$($env:NUM_CHATS)" `
  -e "MAX_VUS=$($env:MAX_VUS)" `
  -e "RAMP_UP=$($env:RAMP_UP)" `
  -e "SUSTAIN=$($env:SUSTAIN)" `
  -e "SPIKE_VUS=$($env:SPIKE_VUS)" `
  -e "SPIKE_DUR=$($env:SPIKE_DUR)" `
  -e "MSG_PER_VU=$($env:MSG_PER_VU)" `
  -e "MSG_INTERVAL=$($env:MSG_INTERVAL)" `
  .\gomin-load-test.js
