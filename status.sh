#!/bin/bash
# AlgoJudge Status Check Script

echo "🔍 AlgoJudge System Status Check"
echo "================================"

# Check Docker
if docker info > /dev/null 2>&1; then
    echo "✅ Docker: Running"
else
    echo "❌ Docker: Not running"
fi

# Check Ollama
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama: Running"
    # Check if CodeLlama is available
    if curl -s http://localhost:11434/api/tags | grep -q "codellama"; then
        echo "✅ CodeLlama: Available"
    else
        echo "⚠️  CodeLlama: Not found - run 'ollama pull codellama:7b'"
    fi
else
    echo "❌ Ollama: Not running"
fi

# Check AlgoJudge services
echo ""
echo "🐳 AlgoJudge Services:"

if docker-compose ps | grep -q "algojudge.*backend.*Up"; then
    echo "✅ Backend: Running"
    # Health check
    if curl -s http://localhost:8000/healthz > /dev/null; then
        echo "✅ Backend API: Healthy"
    else
        echo "⚠️  Backend API: Not responding"
    fi
else
    echo "❌ Backend: Not running"
fi

if docker-compose ps | grep -q "algojudge.*frontend.*Up"; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Not running"
fi

if docker-compose ps | grep -q "algojudge.*db.*Up"; then
    echo "✅ Database: Running"
else
    echo "❌ Database: Not running"
fi

echo ""
echo "📊 Quick Actions:"
echo "   Start services: docker-compose up -d"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
