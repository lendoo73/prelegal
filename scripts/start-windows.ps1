$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Building Prelegal..."
docker build -t prelegal .

Write-Host "Starting Prelegal..."
docker stop prelegal 2>$null; $true
docker rm prelegal 2>$null; $true
if (Test-Path ".env") {
    docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal
} else {
    docker run -d --name prelegal -p 8000:8000 prelegal
}

Write-Host "Prelegal is running at http://localhost:8000"
