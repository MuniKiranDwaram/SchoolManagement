#!/usr/bin/env bash
set -euo pipefail

APP_NAME="SchoolManagement"
APP_DOMAIN="${APP_DOMAIN:-ItsYourSchool.com}"
APP_BASE_URL="https://${APP_DOMAIN}"
APP_REPO_URL="${APP_REPO_URL:-https://github.com/your-user/SchoolManagement.git}"
APP_REPO_DIR="/home/ubuntu/SchoolManagement"
BACKEND_DIR="/var/www/schoolmanagement-backend"
FRONTEND_DIR="/var/www/schoolmanagement-frontend"
PG_USER="schooladmin"
PG_PASSWORD="${PG_PASSWORD:-StrongPassword123!}"
PG_DB="schoolmanagement"
PG_HOST="localhost"
PG_PORT="5432"
JWT_KEY="${JWT_KEY:-$(openssl rand -hex 32)}"
JWT_ISSUER="${JWT_ISSUER:-SchoolManagementApp}"
JWT_AUDIENCE="${JWT_AUDIENCE:-SchoolManagementAppUsers}"

echo "=================================================="
echo "Deploying ${APP_NAME} to Oracle VM"
echo "Domain: ${APP_DOMAIN}"
echo "Frontend URL: ${APP_BASE_URL}"
echo "=================================================="

if [[ "$EUID" -eq 0 ]]; then
  echo "Do not run this script as root. Run it as ubuntu user with sudo privileges."
  exit 1
fi

sudo apt update
sudo apt install -y wget curl unzip ca-certificates gnupg lsb-release nginx git openssl

if ! command -v dotnet >/dev/null 2>&1; then
  echo "Installing .NET 8 runtime..."
  wget https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 8.0
  echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
  echo 'export PATH=$PATH:$DOTNET_ROOT' >> ~/.bashrc
  export DOTNET_ROOT="$HOME/.dotnet"
  export PATH="$PATH:$DOTNET_ROOT"
else
  echo ".NET is already installed."
fi

export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$PATH:$DOTNET_ROOT"

dotnet --version

sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo DEBIAN_FRONTEND=noninteractive apt install -y postgresql-16 postgresql-client-16
sudo systemctl enable postgresql
sudo systemctl start postgresql

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE USER ${PG_USER} WITH PASSWORD '${PG_PASSWORD}';"
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE ${PG_DB} OWNER ${PG_USER};"
fi

if [ ! -d "$APP_REPO_DIR" ]; then
  git clone "$APP_REPO_URL" "$APP_REPO_DIR"
fi

cd "$APP_REPO_DIR"

auth_file="/etc/schoolmanagement.env"
cat > "$auth_file" <<EOF
POSTGRES_CONNECTION_STRING="Host=${PG_HOST};Port=${PG_PORT};Database=${PG_DB};Username=${PG_USER};Password=${PG_PASSWORD};"
DB_HOST=${PG_HOST}
DB_PORT=${PG_PORT}
DB_NAME=${PG_DB}
DB_USER=${PG_USER}
DB_PASSWORD=${PG_PASSWORD}
JWT_KEY=${JWT_KEY}
JWT_ISSUER=${JWT_ISSUER}
JWT_AUDIENCE=${JWT_AUDIENCE}
FRONTEND_ALLOWED_ORIGIN=${APP_BASE_URL}
EOF

sudo chown root:root "$auth_file"
sudo chmod 600 "$auth_file"

cd "$APP_REPO_DIR/Backend/Backend"

dotnet publish -c Release -o "$BACKEND_DIR"

cd "$APP_REPO_DIR/Frontend"
cat > .env.production <<EOF
VITE_API_BASE_URL=${APP_BASE_URL}
EOF
npm install
npm run build
sudo mkdir -p "$FRONTEND_DIR"
sudo rm -rf "$FRONTEND_DIR"/*
sudo cp -r dist/* "$FRONTEND_DIR/"

sudo tee /etc/systemd/system/schoolmanagement-backend.service >/dev/null <<EOF
[Unit]
Description=School Management Backend
After=network.target

[Service]
WorkingDirectory=${BACKEND_DIR}
ExecStart=/home/ubuntu/.dotnet/dotnet ${BACKEND_DIR}/Backend.dll --urls http://127.0.0.1:5183
Restart=always
RestartSec=10
KillSignal=SIGINT
EnvironmentFile=/etc/schoolmanagement.env
User=ubuntu
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_ROOT=/home/ubuntu/.dotnet
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/home/ubuntu/.dotnet:/home/ubuntu/.dotnet/tools

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable schoolmanagement-backend.service
sudo systemctl restart schoolmanagement-backend.service
sudo systemctl status --no-pager schoolmanagement-backend.service || true

sudo tee /etc/nginx/conf.d/schoolmanagement.conf >/dev/null <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN} www.${APP_DOMAIN};

    root ${FRONTEND_DIR};
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5183;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:5183/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx

if ! command -v certbot >/dev/null 2>&1; then
  sudo apt install -y certbot python3-certbot-nginx
fi

if ! sudo certbot certificates 2>/dev/null | grep -q "${APP_DOMAIN}"; then
  echo "Attempting HTTPS setup with Let's Encrypt for ${APP_DOMAIN}."
  echo "Make sure DNS for ${APP_DOMAIN} points to this VM before continuing."
  sudo certbot --nginx -d "${APP_DOMAIN}" -d "www.${APP_DOMAIN}" --non-interactive --agree-tos --email admin@${APP_DOMAIN}
fi

echo "=================================================="
echo "Deployment complete."
echo "Frontend: ${APP_BASE_URL}"
echo "API: ${APP_BASE_URL}/api"
echo "Health: ${APP_BASE_URL}/health"
echo "Database: ${PG_DB} on ${PG_HOST}:${PG_PORT}"
echo "=================================================="
