#!/bin/bash

# Ensure script is run with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (using sudo)"
  exit 1
fi

echo "Setting up Linkoteca backend in /opt/linkoteca/backend..."

# Create target directory
mkdir -p /opt/linkoteca/backend

# Copy backend files (excluding venv, __pycache__, etc)
rsync -a --exclude 'venv' --exclude '__pycache__' --exclude '.pytest_cache' ./ /opt/linkoteca/backend/

# Setup virtual environment
echo "Setting up Python virtual environment..."
python3 -m venv /opt/linkoteca/backend/venv
/opt/linkoteca/backend/venv/bin/pip install -r /opt/linkoteca/backend/requirements.txt

# Set permissions
chown -R root:www-data /opt/linkoteca/backend
chmod -R 775 /opt/linkoteca/backend

# Install systemd service
echo "Installing systemd service..."
cp /opt/linkoteca/backend/linkoteca-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable linkoteca-backend
systemctl restart linkoteca-backend

echo "Linkoteca backend installed and running successfully!"
systemctl status linkoteca-backend --no-pager
