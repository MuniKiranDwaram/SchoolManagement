#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="SchoolManagement"
APP_DOMAIN="${APP_DOMAIN:-ItsYourSchool.com}"
APP_BASE_URL="https://${APP_DOMAIN}"
APP_REPO_URL="${APP_REPO_URL:-https://github.com/MuniKiranDwaram/SchoolManagement.git}"
APP_REPO_DIR="${APP_REPO_DIR:-/home/ubuntu/SchoolManagement}"
BACKEND_DIR="/var/www/schoolmanagement-backend"
FRONTEND_DIR="/var/www/schoolmanagement-frontend"
AUTH_FILE="/etc/schoolmanagement.env"

PG_USER="${PG_USER:-schooladmin}"
PG_PASSWORD="${PG_PASSWORD:-StrongPassword123!}"
PG_DB="${PG_DB:-schoolmanagement}"
PG_HOST="localhost"
PG_PORT="5432"
JWT_ISSUER="${JWT_ISSUER:-SchoolManagementApp}"
JWT_AUDIENCE="${JWT_AUDIENCE:-SchoolManagementAppUsers}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@${APP_DOMAIN}}"

log()  { printf '\n[%s] INFO  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
warn() { printf '\n[%s] WARN  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; }
error() { printf '\n[%s] ERROR %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; }
fail() { error "$*"; exit 1; }

log "=================================================="
log "Deploying ${APP_NAME}"
log "Domain: ${APP_DOMAIN}"
log "Frontend URL: ${APP_BASE_URL}"
log "=================================================="

if [[ "${EUID}" -eq 0 ]]; then
  fail "Do not run this script as root. Run it as the ubuntu user with sudo privileges."
fi

if ! command -v sudo >/dev/null 2>&1; then
  fail "sudo is required."
fi

# Suppress needrestart prompts before any package installation.
sudo mkdir -p /etc/needrestart/conf.d
printf '%s\n' '$nrconf{restart} = "a";' | sudo tee /etc/needrestart/conf.d/99-auto.conf >/dev/null
printf '%s\n' '$nrconf{kernelhints} = 0;' | sudo tee -a /etc/needrestart/conf.d/99-auto.conf >/dev/null

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
sudo apt-get update -qq
sudo apt-get install -y -qq \
  wget curl unzip ca-certificates gnupg lsb-release nginx git openssl postgresql-client \
  >/dev/null

# Replace unsupported Ubuntu Node.js packages with Node.js 20 LTS.
log "Ensuring Node.js 20 LTS is installed."
sudo apt-get purge -y -qq nodejs npm libnode72 2>/dev/null || true
sudo apt-get autoremove -y -qq >/dev/null || true
sudo apt-get update -qq

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y -qq nodejs >/dev/null

NODE_VERSION="$(node -v 2>/dev/null || true)"
NPM_VERSION="$(npm -v 2>/dev/null || true)"
NODE_MAJOR="$(printf '%s' "${NODE_VERSION}" | sed -E 's/^v([0-9]+).*/\1/')"

if [[ -z "${NODE_MAJOR}" || ! "${NODE_MAJOR}" =~ ^[0-9]+$ ]]; then
  fail "Node.js is not installed or node -v did not return a valid version."
fi

if (( NODE_MAJOR < 20)); then
  fail "Unsupported Node.js ${NODE_VERSION}. Node.js 20 or newer is required, and Node.js 20 LTS was requested."
fi

if [[ -z "${NPM_VERSION}" ]]; then
  fail "npm is not available after Node.js installation."
fi

NODE_VERSION="$(node -v 2>/dev/null || true)"
NPM_VERSION="$(npm -v 2>/dev/null || true)"
log "Node.js version: ${NODE_VERSION}"
log "npm version: ${NPM_VERSION}"

# Preserve existing secrets before PostgreSQL setup or package reruns.
if sudo test -f "${AUTH_FILE}"; then
  log "Preserving existing production secrets from ${AUTH_FILE}."
  EXISTING_DB_PASSWORD="$(sudo sed -n 's/^DB_PASSWORD=//p' "${AUTH_FILE}" | tail -n 1)"
  EXISTING_JWT_KEY="$(sudo sed -n 's/^JWT_KEY=//p' "${AUTH_FILE}" | tail -n 1)"
  EXISTING_JWT_ISSUER="$(sudo sed -n 's/^JWT_ISSUER=//p' "${AUTH_FILE}" | tail -n 1)"
  EXISTING_JWT_AUDIENCE="$(sudo sed -n 's/^JWT_AUDIENCE=//p' "${AUTH_FILE}" | tail -n 1)"
  PG_PASSWORD="${EXISTING_DB_PASSWORD:-${PG_PASSWORD}}"
  JWT_KEY="${EXISTING_JWT_KEY:-${JWT_KEY:-$(openssl rand -hex 32)}}"
  JWT_ISSUER="${EXISTING_JWT_ISSUER:-${JWT_ISSUER}}"
  JWT_AUDIENCE="${EXISTING_JWT_AUDIENCE:-${JWT_AUDIENCE}}"
else
  JWT_KEY="${JWT_KEY:-$(openssl rand -hex 32)}"
fi

# Install or reuse .NET 8.
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
export PATH="${DOTNET_ROOT}:${HOME}/.dotnet/tools:${PATH}"

if command -v dotnet >/dev/null 2>&1; then
  DOTNET_CMD="$(command -v dotnet)"
  log ".NET is already available: $(${DOTNET_CMD} --version)"
elif [[ -x "${HOME}/.dotnet/dotnet" ]]; then
  DOTNET_CMD="${HOME}/.dotnet/dotnet"
  log ".NET is already installed under ${HOME}/.dotnet"
else
  log "Installing .NET 8."
  wget -q https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 8.0
  DOTNET_CMD="${DOTNET_ROOT}/dotnet"
fi

[[ -x "${DOTNET_CMD}" ]] || fail "dotnet is unavailable after installation."

# PostgreSQL repository key: recognize both old and new names and never prompt.
PG_KEY_FOUND=false
for key_file in \
  /etc/apt/trusted.gpg.d/postgresql.asc \
  /etc/apt/trusted.gpg.d/postgresql.gpg
do
  if [[ -s "${key_file}" ]]; then
    PG_KEY_FOUND=true
    PG_KEY_FILE="${key_file}"
    break
  fi
done

if [[ "${PG_KEY_FOUND}" != true ]]; then
  log "Installing PostgreSQL APT repository key."
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | sudo gpg --batch --yes --dearmor -o /tmp/postgresql.asc
  sudo install -o root -g root -m 0644 /tmp/postgresql.asc /etc/apt/trusted.gpg.d/postgresql.asc
  PG_KEY_FILE=/etc/apt/trusted.gpg.d/postgresql.asc
fi

sudo rm -f /tmp/postgresql.asc 2>/dev/null || true
log "Using PostgreSQL key: ${PG_KEY_FILE}"

PG_REPO_LINE="deb [signed-by=${PG_KEY_FILE}] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main"
if ! sudo grep -Fqx "${PG_REPO_LINE}" /etc/apt/sources.list.d/pgdg.list 2>/dev/null; then
  log "Creating PostgreSQL APT repository entry."
  printf '%s\n' "${PG_REPO_LINE}" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null
fi

sudo apt-get update -qq
sudo apt-get install -y -qq postgresql-16 postgresql-client-16 >/dev/null
sudo systemctl enable postgresql >/dev/null
sudo systemctl start postgresql

if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'" | grep -qx 1; then
  log "PostgreSQL role '${PG_USER}' already exists."
  sudo -u postgres psql -v ON_ERROR_STOP=1 \
    -c "ALTER ROLE \"${PG_USER}\" WITH LOGIN PASSWORD '${PG_PASSWORD}';"
else
  log "Creating PostgreSQL role '${PG_USER}'."
  sudo -u postgres psql -v ON_ERROR_STOP=1 \
    -c "CREATE ROLE \"${PG_USER}\" LOGIN PASSWORD '${PG_PASSWORD}';"
fi

if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -qx 1; then
  log "PostgreSQL database '${PG_DB}' already exists."
else
  log "Creating PostgreSQL database '${PG_DB}'."
  sudo -u postgres createdb --owner="${PG_USER}" "${PG_DB}"
fi

# Use or clone the repository.
if [[ -d "${APP_REPO_DIR}" ]]; then
  if [[ -d "${APP_REPO_DIR}/.git" ]]; then
    log "Repository already exists; pulling origin main."
    git -C "${APP_REPO_DIR}" remote set-url origin "${APP_REPO_URL}"
    git -C "${APP_REPO_DIR}" fetch --prune origin
    git -C "${APP_REPO_DIR}" pull origin main
  else
    fail "${APP_REPO_DIR} exists but is not a Git repository."
  fi
else
  log "Cloning repository."
  git clone "${APP_REPO_URL}" "${APP_REPO_DIR}"
fi

cd "${APP_REPO_DIR}"

# Create the root-only environment file atomically.
log "Writing ${AUTH_FILE}."
{
  printf 'POSTGRES_CONNECTION_STRING="Host=%s;Port=%s;Database=%s;Username=%s;Password=%s;"\n' "${PG_HOST}" "${PG_PORT}" "${PG_DB}" "${PG_USER}" "${PG_PASSWORD}"
  printf 'DB_HOST=%s\n' "${PG_HOST}"
  printf 'DB_PORT=%s\n' "${PG_PORT}"
  printf 'DB_NAME=%s\n' "${PG_DB}"
  printf 'DB_USER=%s\n' "${PG_USER}"
  printf 'DB_PASSWORD=%s\n' "${PG_PASSWORD}"
  printf 'JWT_KEY=%s\n' "${JWT_KEY}"
  printf 'JWT_ISSUER=%s\n' "${JWT_ISSUER}"
  printf 'JWT_AUDIENCE=%s\n' "${JWT_AUDIENCE}"
  printf 'FRONTEND_ALLOWED_ORIGIN=%s\n' "${APP_BASE_URL}"
} | sudo tee "${AUTH_FILE}.tmp" >/dev/null
sudo chown root:root "${AUTH_FILE}.tmp"
sudo chmod 0600 "${AUTH_FILE}.tmp"
sudo mv -f "${AUTH_FILE}.tmp" "${AUTH_FILE}"
sudo chown root:root "${AUTH_FILE}"
sudo chmod 0600 "${AUTH_FILE}"

log "Publishing backend."
cd "${APP_REPO_DIR}/Backend/Backend"
${DOTNET_CMD} publish -c Release -o "${BACKEND_DIR}"

log "Building frontend."
cd "${APP_REPO_DIR}/Frontend"

NODE_VERSION="$(node -v 2>/dev/null || true)"
NPM_VERSION="$(npm -v 2>/dev/null || true)"
NODE_MAJOR="$(printf '%s' "${NODE_VERSION}" | sed -E 's/^v([0-9]+).*/\1/')"

if [[ -z "${NODE_MAJOR}" || ! "${NODE_MAJOR}" =~ ^[0-9]+$ ]]; then
  fail "Cannot build frontend: node -v did not return a valid version."
fi

if (( NODE_MAJOR < 20 )); then
  fail "Cannot build frontend with unsupported Node.js ${NODE_VERSION}. Node.js 20 or newer is required."
fi

log "Using Node.js ${NODE_VERSION} and npm ${NPM_VERSION} for frontend build."
printf 'VITE_API_BASE_URL=%s\n' "${APP_BASE_URL}" | tee .env.production >/dev/null
npm install --no-audit --no-fund
npm run build

sudo mkdir -p "${FRONTEND_DIR}"
sudo find "${FRONTEND_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -a dist/. "${FRONTEND_DIR}/"

log "Installing backend systemd service."
cat <<EOF | sudo tee /etc/systemd/system/schoolmanagement-backend.service >/dev/null
[Unit]
Description=School Management Backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
WorkingDirectory=${BACKEND_DIR}
ExecStart=/home/ubuntu/.dotnet/dotnet ${BACKEND_DIR}/Backend.dll --urls http://127.0.0.1:5183
Restart=always
RestartSec=10
KillSignal=SIGINT
EnvironmentFile=${AUTH_FILE}
User=ubuntu
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_ROOT=/home/ubuntu/.dotnet
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/home/ubuntu/.dotnet:/home/ubuntu/.dotnet/tools

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable schoolmanagement-backend.service >/dev/null
sudo systemctl restart schoolmanagement-backend.service

log "Installing Nginx configuration."
cat <<EOF | sudo tee /etc/nginx/conf.d/schoolmanagement.conf >/dev/null
server {
    listen 80;
    listen [::]:80;
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

log "Waiting for backend health endpoint."
HEALTH_OK=false
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:5183/health >/dev/null 2>&1; then
    HEALTH_OK=true
    break
  fi
  sleep 2
done

if [[ "${HEALTH_OK}" != true ]]; then
  sudo systemctl status schoolmanagement-backend.service --no-pager || true
  sudo journalctl -u schoolmanagement-backend.service -n 50 --no-pager || true
  fail "Backend health check failed."
fi

if ! command -v certbot >/dev/null 2>&1; then
  log "Installing Certbot."
  sudo apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
fi

if sudo certbot certificates 2>/dev/null | grep -Fq "${APP_DOMAIN}"; then
  log "TLS certificate already exists for ${APP_DOMAIN}."
else
  log "Attempting HTTPS setup for ${APP_DOMAIN}."
  log "Ensure DNS A records point ${APP_DOMAIN} and www.${APP_DOMAIN} to this VM public IP."
  sudo certbot --nginx \
    -d "${APP_DOMAIN}" \
    -d "www.${APP_DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --email "${CERTBOT_EMAIL}" \
    --redirect
fi

log "=================================================="
log "Deployment complete"
log "Frontend: ${APP_BASE_URL}"
log "API: ${APP_BASE_URL}/api"
log "Health: ${APP_BASE_URL}/health"
log "Database: ${PG_DB} on ${PG_HOST}:${PG_PORT}"
log "=================================================="
