# AlgoJudge Production Deployment Script for Windows
# Run with: powershell -ExecutionPolicy Bypass -File deploy.ps1

Write-Host "🚀 Starting AlgoJudge deployment..." -ForegroundColor Green

# Check Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Ollama is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5
} catch {
    Write-Host "❌ Ollama is not running. Please install and start Ollama first:" -ForegroundColor Red
    Write-Host "   Download from: https://ollama.ai/download" -ForegroundColor Yellow
    Write-Host "   Then run: ollama serve" -ForegroundColor Yellow
    Write-Host "   Then run: ollama pull codellama:7b" -ForegroundColor Yellow
    exit 1
}

# Create environment file if it doesn't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "📝 Creating environment configuration..." -ForegroundColor Blue
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️  Please edit backend\.env with your production settings!" -ForegroundColor Yellow
    Read-Host "Press enter to continue"
}

# Build and start services
Write-Host "🔨 Building Docker images..." -ForegroundColor Blue
docker-compose build --no-cache

Write-Host "🗄️  Starting database..." -ForegroundColor Blue
docker-compose up -d db

Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Blue
Start-Sleep 10

Write-Host "🔧 Running database health check..." -ForegroundColor Blue
try {
    docker-compose exec db psql -U algojudge -d algojudge -c "SELECT version();"
} catch {
    Write-Host "⚠️  Database might still be starting up..." -ForegroundColor Yellow
}

Write-Host "🚀 Starting all services..." -ForegroundColor Blue
docker-compose up -d

Write-Host "🔍 Checking service health..." -ForegroundColor Blue
Start-Sleep 5

# Health checks
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/healthz" -Method GET -TimeoutSec 10
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend is healthy (port 8000)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend is healthy (port 3000)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend health check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 AlgoJudge deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access your application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitor logs:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Stop services:" -ForegroundColor Cyan
Write-Host "   docker-compose down" -ForegroundColor White
