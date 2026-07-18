#!/bin/bash

# Ensure script is run with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (using sudo)"
  exit 1
fi

echo "Setting up Linkami backend in /opt/linkami/backend..."

# Create target directory
mkdir -p /opt/linkami/backend

# Copy backend files (excluding venv, __pycache__, etc)
rsync -a --exclude 'venv' --exclude '__pycache__' --exclude '.pytest_cache' ./ /opt/linkami/backend/

# Setup virtual environment
echo "Setting up Python virtual environment..."
python3 -m venv /opt/linkami/backend/venv
/opt/linkami/backend/venv/bin/pip install -r /opt/linkami/backend/requirements.txt

# Set permissions
chown -R root:www-data /opt/linkami/backend
chmod -R 775 /opt/linkami/backend

# Install systemd service
echo "Installing systemd service..."
cp /opt/linkami/backend/linkami-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable linkami-backend
systemctl restart linkami-backend

echo "Linkami backend installed and running successfully!"
systemctl status linkami-backend --no-pager
