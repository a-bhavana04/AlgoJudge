# 🏛️ AlgoJudge

A comprehensive coding problem analysis platform powered by AI, featuring secure Docker sandboxing and real-time LLM feedback using CodeLlama 7B.

## ✨ Features

- **🔐 User Authentication**: Secure JWT-based login system
- **🐳 Code Sandboxing**: Secure Docker containers for code execution
- **🤖 AI Analysis**: Real-time code analysis using CodeLlama 7B via Ollama
- **💬 Interactive Chat**: Stream responses for code feedback and optimization tips
- **📊 Dashboard**: Track submissions and execution statistics
- **🧪 Test Cases**: Custom test case validation
- **🌐 Multi-Language**: Support for Python, C++, C, Java, JavaScript, Go
- **📱 Modern UI**: React frontend with syntax highlighting

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │◄──►│     Backend     │◄──►│   PostgreSQL    │
│   (React)       │    │   (FastAPI)     │    │   Database      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┼────────┐
                       │                 │
                       ▼                 ▼
                ┌─────────────┐   ┌─────────────┐
                │   Docker    │   │   Ollama    │
                │  Sandbox    │   │ (CodeLlama) │
                └─────────────┘   └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **Docker & Docker Compose**
   ```bash
   # Install Docker Desktop from https://docker.com/products/docker-desktop
   ```

2. **Ollama with CodeLlama 7B**
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Start Ollama service
   ollama serve
   
   # Pull CodeLlama model
   ollama pull codellama:7b
   ```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AlgoJudge
   ```

2. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

3. **Deploy with one command**
   ```bash
   # Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh
   
   # Windows
   powershell -ExecutionPolicy Bypass -File deploy.ps1
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Manual Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Setup

```bash
# Start PostgreSQL with Docker
docker run -d \
  --name algojudge-db \
  -e POSTGRES_DB=algojudge \
  -e POSTGRES_USER=algojudge \
  -e POSTGRES_PASSWORD=algojudge123 \
  -p 5432:5432 \
  postgres:15-alpine
```

## 📁 Project Structure

```
AlgoJudge/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── sandbox.py           # Docker code execution
│   ├── llm.py              # Ollama integration
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Backend container
│   ├── .env.example        # Environment template
│   └── db/
│       ├── database.py     # Database connection
│       ├── models.py       # SQLAlchemy models
│       └── crud.py         # Database operations
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JudgePanel.jsx    # Main code interface
│   │   │   ├── Login.jsx         # Authentication
│   │   │   └── Dashboard.jsx     # User dashboard
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile          # Frontend container
├── docker-compose.yml      # Multi-service deployment
├── deploy.sh              # Linux/Mac deployment
├── deploy.ps1             # Windows deployment
└── README.md
```

## 🔒 Security Features

- **Docker Sandboxing**: Isolated containers with limited resources
- **Network Isolation**: No internet access for executed code
- **Memory Limits**: Configurable memory constraints (default: 128MB)
- **Execution Timeouts**: Prevents infinite loops (default: 30s)
- **JWT Authentication**: Secure user sessions
- **Password Hashing**: bcrypt for secure password storage

## 🌐 Supported Languages

| Language   | File Extension | Execution Environment |
|------------|---------------|---------------------|
| Python     | `.py`         | python:3.11-slim    |
| C++        | `.cpp`        | gcc:latest          |
| C          | `.c`          | gcc:latest          |
| Java       | `.java`       | openjdk:latest      |
| JavaScript | `.js`         | node:latest         |
| Go         | `.go`         | golang:latest       |

## 🤖 AI Features

- **Code Analysis**: Automatic complexity analysis
- **Best Practices**: Style and optimization suggestions
- **Bug Detection**: Common error identification
- **Alternative Approaches**: Multiple solution strategies
- **Real-time Streaming**: Live AI responses

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Code Execution
- `POST /submit` - Submit code for execution
- `GET /dashboard` - User submissions dashboard

### AI Chat
- `POST /chat` - Stream AI analysis responses

### Health
- `GET /healthz` - Service health check

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Security
JWT_SECRET=your-secret-key

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=codellama:7b

# Sandbox
SANDBOX_TIMEOUT=30
SANDBOX_MEMORY_LIMIT=128m
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose exec backend pytest tests/
```

## 📦 Production Deployment

### AWS EC2 Deployment

1. **Launch EC2 instance** (t3.large recommended)
2. **Install Docker and Docker Compose**
3. **Install Ollama and pull CodeLlama**
4. **Clone repository and deploy**
5. **Configure security groups** (ports 80, 443, 8000, 3000)

### Environment Considerations

- **Memory**: Minimum 4GB RAM for Ollama + containers
- **Storage**: 10GB+ for Docker images and models
- **CPU**: 2+ cores recommended for concurrent execution

## 🐛 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   
   # Restart Ollama
   ollama serve
   ```

2. **Docker Permission Denied**
   ```bash
   # Add user to docker group (Linux)
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **Database Connection Error**
   ```bash
   # Check PostgreSQL container
   docker-compose logs db
   
   # Restart database
   docker-compose restart db
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** for the excellent web framework
- **Ollama** for local LLM hosting
- **CodeLlama** for code analysis capabilities
- **Docker** for secure sandboxing
- **React** for the modern frontend

---

Made with ❤️ for the coding community
