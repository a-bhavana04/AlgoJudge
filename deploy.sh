#!/bin/bash
# AlgoJudge Production Deployment Script

set -e

echo "🚀 Starting AlgoJudge deployment..."

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama is not running. Please start Ollama first:"
    echo "   curl -fsSL https://ollama.ai/install.sh | sh"
    echo "   ollama serve"
    echo "   ollama pull codellama:7b"
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating environment configuration..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your production settings!"
    read -p "Press enter to continue..."
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🗄️  Starting database..."
docker-compose up -d db

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔧 Running database migrations..."
docker-compose exec db psql -U algojudge -d algojudge -c "SELECT version();"

echo "🚀 Starting all services..."
docker-compose up -d

echo "🔍 Checking service health..."
sleep 5

# Health checks
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/healthz || echo "000")
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")

if [ "$backend_status" = "200" ]; then
    echo "✅ Backend is healthy (port 8000)"
else
    echo "❌ Backend health check failed"
fi

if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend is healthy (port 3000)"
else
    echo "❌ Frontend health check failed"
fi

echo ""
echo "🎉 AlgoJudge deployment complete!"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Monitor logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
