#!/bin/bash

# AlgoJudge EC2 Deployment Script
# This script sets up AlgoJudge on an Ubuntu EC2 instance

set -e

echo "🚀 Starting AlgoJudge deployment on EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Ollama for AI features
echo "🤖 Installing Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
echo "🔄 Starting Ollama service..."
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull CodeLlama model
echo "📥 Downloading CodeLlama model (this may take several minutes)..."
ollama pull codellama:7b

# Install Node.js (for development/debugging)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python and pip
echo "🐍 Installing Python..."
sudo apt install -y python3 python3-pip

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/algojudge
sudo chown $USER:$USER /opt/algojudge

# Clone repository (if using Git)
if [ ! -z "$REPO_URL" ]; then
    echo "📥 Cloning repository..."
    git clone $REPO_URL /opt/algojudge
    cd /opt/algojudge
else
    echo "📁 Please upload your AlgoJudge files to /opt/algojudge"
    echo "Or set REPO_URL environment variable to clone from Git"
fi

echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your AlgoJudge code to /opt/algojudge (if not using Git)"
echo "2. cd /opt/algojudge"
echo "3. sudo docker-compose up -d"
echo "4. Configure security groups to allow ports 3000 and 8000"
echo ""
echo "🌐 Your AlgoJudge will be available at:"
echo "   Frontend: http://YOUR_EC2_IP:3000"
echo "   Backend:  http://YOUR_EC2_IP:8000"
