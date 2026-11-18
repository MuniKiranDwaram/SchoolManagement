# Oracle Always Free deployment guide for School Management

This guide is for deploying the current monolith-style app to an Oracle Cloud Infrastructure Always Free VM using PostgreSQL on the VM itself.

## 1. Architecture choice

This app already supports the correct deployment model for a free OCI setup:

- backend: ASP.NET Core 8 API
- database: PostgreSQL 16 on the same Oracle VM
- frontend: React + Vite static build served by Nginx
- reverse proxy: Nginx handles frontend and API routing
- TLS: Let’s Encrypt via Certbot

This avoids the need for a rewrite and matches the current app design in [Backend/Backend/Program.cs](../Backend/Backend/Program.cs), [Frontend/package.json](../Frontend/package.json), and the deployment docs in [docs/deployment-readiness.md](deployment-readiness.md).

## 2. Oracle VM prerequisites

Create an OCI Always Free VM with:

- Ubuntu 22.04 LTS
- 1 vCPU / 1 GB RAM is the free minimum and should work for a lightweight setup
- public IP assigned
- security list rules for:
  - 22 TCP (SSH)
  - 80 TCP (HTTP)
  - 443 TCP (HTTPS)

Connect to the VM:

```bash
ssh ubuntu@YOUR_VM_PUBLIC_IP
```

## 3. Install system dependencies

```bash
sudo apt update
sudo apt install -y wget curl unzip ca-certificates gnupg lsb-release nginx git
```

Install .NET 8:

```bash
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
bash dotnet-install.sh --channel 8.0

export DOTNET_ROOT=$HOME/.dotnet
export PATH=$PATH:$DOTNET_ROOT
```

Add to shell profile if needed:

```bash
echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
echo 'export PATH=$PATH:$DOTNET_ROOT' >> ~/.bashrc
source ~/.bashrc
```

Verify:

```bash
dotnet --version
```

## 4. Install PostgreSQL 16

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16
```

Start and enable PostgreSQL:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create database user and database:

```bash
sudo -u postgres psql -c "CREATE USER schooladmin WITH PASSWORD 'StrongPassword123!';"
sudo -u postgres psql -c "CREATE DATABASE schoolmanagement OWNER schooladmin;"
```

Optional: allow password login from localhost:

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Add this line for local connections if needed:

```text
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Then restart Postgres:

```bash
sudo systemctl restart postgresql
```

## 5. Clone and publish the app

Clone the repo to the VM:

```bash
git clone https://github.com/your-user/SchoolManagement.git
cd SchoolManagement
```

Build the backend in release mode:

```bash
cd Backend/Backend
DOTNET_ROOT=$HOME/.dotnet PATH=$PATH:$DOTNET_ROOT dotnet publish -c Release -o /var/www/schoolmanagement-backend
```

Build the frontend:

```bash
cd ../../Frontend
npm install
npm run build
```

Then copy the static frontend build to a web directory:

```bash
sudo mkdir -p /var/www/schoolmanagement-frontend
sudo cp -r dist/* /var/www/schoolmanagement-frontend/
```

## 6. Configure environment variables

Create a production environment file for the backend:

```bash
sudo nano /etc/schoolmanagement.env
```

Example contents:

```bash
POSTGRES_CONNECTION_STRING="Host=localhost;Port=5432;Database=schoolmanagement;Username=schooladmin;Password=StrongPassword123!;"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schoolmanagement
DB_USER=schooladmin
DB_PASSWORD=StrongPassword123!
JWT_KEY=replace-with-a-long-random-secret-value
JWT_ISSUER=SchoolManagementApp
JWT_AUDIENCE=SchoolManagementAppUsers
FRONTEND_ALLOWED_ORIGIN=https://yourdomain.com
```

Then source it before starting the app:

```bash
set -a
source /etc/schoolmanagement.env
set +a
```

## 7. Run database migrations

From the published backend folder:

```bash
cd /var/www/schoolmanagement-backend
DOTNET_ROOT=$HOME/.dotnet PATH=$PATH:$DOTNET_ROOT dotnet Backend.dll
```

The app automatically runs migrations on startup. If needed, you can also run via EF CLI from the project source:

```bash
cd /home/ubuntu/SchoolManagement/Backend/Backend
DOTNET_ROOT=$HOME/.dotnet PATH=$PATH:$DOTNET_ROOT dotnet ef database update
```

## 8. Create a backend systemd service

Create the service file:

```bash
sudo nano /etc/systemd/system/schoolmanagement-backend.service
```

Example content:

```ini
[Unit]
Description=School Management Backend
After=network.target

[Service]
WorkingDirectory=/var/www/schoolmanagement-backend
ExecStart=/home/ubuntu/.dotnet/dotnet /var/www/schoolmanagement-backend/Backend.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=schoolmanagement-backend
EnvironmentFile=/etc/schoolmanagement.env
User=ubuntu
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_ROOT=/home/ubuntu/.dotnet
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/home/ubuntu/.dotnet:/home/ubuntu/.dotnet/tools

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable schoolmanagement-backend.service
sudo systemctl start schoolmanagement-backend.service
sudo systemctl status schoolmanagement-backend.service
```

## 9. Nginx frontend and API proxy configuration

Create the site config:

```bash
sudo nano /etc/nginx/sites-available/schoolmanagement
```

Example:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/schoolmanagement-frontend;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5183;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:5183/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/schoolmanagement /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Configure HTTPS with Let’s Encrypt

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request certificate:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

This will update nginx config automatically.

## 11. Use the app

Once the backend and front-end are up:

- app should be available at `https://yourdomain.com`
- API will run under the same domain, proxied by Nginx
- health check on `https://yourdomain.com/health`

## 12. Production hardening checklist

Before considering this production-ready, complete:

- set a strong JWT secret
- rotate database credentials
- back up Postgres regularly
- configure firewall and fail2ban
- use a real DNS domain
- add uptime/monitoring alerts
- ensure admin-only tenant actions remain enforced
- test logout and auth flows in the deployed environment

## 13. Common troubleshooting

### Backend not starting
Check:

```bash
sudo journalctl -u schoolmanagement-backend -n 100 --no-pager
```

### Database connection refused
Check PostgreSQL service:

```bash
sudo systemctl status postgresql
sudo -u postgres psql -l
```

### Nginx error
Check:

```bash
sudo nginx -t
sudo journalctl -u nginx -n 100 --no-pager
```

## 14. Final recommendation

For a free Oracle setup, the most practical production pattern is:

- one Always Free OCI VM
- PostgreSQL installed on the VM
- backend as a systemd service
- frontend static served by Nginx
- HTTPS via Let’s Encrypt

This is the best fit for the current codebase and requires no major application rewrite.
