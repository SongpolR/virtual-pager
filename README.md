# JustAMomentPlease - Online Queue Pager App

JustAMomentPlease is a restaurant/café paging & order-notification platform built with:

- **Laravel** (REST API)
- **React + Vite** (Web Admin / Staff UI)
- **Node.js + Socket.IO** (Realtime server for live updates, chat/notifications)

It’s designed to be deployed on a single server (e.g., EC2) or scaled into separate services later.

---

## Features

- Shop / staff / owner role separation
- Order tracking & realtime updates (Socket.IO)
- Auth + token-based session
- Password reset / email notifications
- i18n (multi-language UI; e.g., EN/TH)
- Production-friendly setup (Nginx reverse proxy, TLS via Cloudflare / certs)

---

## Architecture

```
[ React Web (Vite) ] ---> [ Laravel API ] ---> [ DB ]
| |
| |
+------ Socket.IO -----+----> [ Node Realtime Server ]
```

- Web app calls the Laravel API for data
- Realtime server pushes updates to clients (orders/status/chat/notifications)
- Email sending via SMTP provider (e.g., Brevo)

---

## Tech Stack

**Backend**

- PHP / Laravel
- Queue (optional)
- MySQL / PostgreSQL (depends on your setup)

**Frontend**

- React
- Vite
- Tailwind CSS
- i18next (translations)

**Realtime**

- Node.js
- Socket.IO

**Infra**

- Nginx reverse proxy
- Docker (optional but recommended)
- Cloudflare (optional)

---

## Repository Structure (example)

```
├─ api/ # Laravel backend (PHP)
├─ web/ # React + Vite frontend
├─ realtime/ # Node.js + Socket.IO server
├─ docker/ # (Optional) docker/nginx configs
└─ README.md
```

---

## Prerequisites

Choose **one** approach:

### Option A: Local dev (no Docker)

- Node.js 18+ (recommended)
- PHP 8.1+ (match your Laravel version)
- Composer
- MySQL/PostgreSQL

### Option B: Docker-based dev

- Docker + Docker Compose

---

## Quick Start (Local Development)

### 1) Backend (Laravel API)

```
cd api
cp .env.example .env
composer install
php artisan key:generate

# Configure DB in .env then:
php artisan migrate --seed

php artisan serve --host=0.0.0.0 --port=8000
```

### 2) Realtime (Socket.IO)

```bash
cd realtime
cp .env.example .env   # if you have one
npm install
npm run dev            # or: node server.js
```

### 3) Frontend (React + Vite)

```
cd web
cp .env.example .env
npm install
npm run dev
```

Open:

- Web: `http://localhost:5173`
- API: `http://localhost:8000`
- Realtime: depends on your config (e.g. `http://localhost:4000`)

---

## Environment Variables

### Web (Vite) example

`web/.env`

```
VITE_API_BASE_URL=http://localhost:8000
VITE_REALTIME_URL=http://localhost:4000
VITE_APP_NAME="VIPA - Virtual Pager"
```

### API (Laravel) example

`api/.env`

```
APP_NAME="VIPA - Virtual Pager"
APP_ENV=local
APP_KEY=base64:CHANGE_ME
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vipa
DB_USERNAME=root
DB_PASSWORD=

# SMTP (Brevo example)
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=YOUR_BREVO_SMTP_LOGIN
MAIL_PASSWORD=YOUR_BREVO_SMTP_KEY
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@your-domain.com
MAIL_FROM_NAME="VIPA"
```

## Realtime (Node) example

`realtime/.env (if used)`

```
PORT=4000
CORS_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:8000
```

---

## App Title Multi-language

For bilingual titles (EN/TH), set a default in `index.html` and update dynamically via i18n:

- `common:app_title` in i18n JSON
- React hook sets `document.title` when language changes

(Implementation lives in the web app.)

---

## Useful Commands

### Laravel

```
php artisan migrate
php artisan queue:work
php artisan config:clear
php artisan route:list
```

### Web

```
npm run dev
npm run build
npm run preview
```

### Realtime

```
npm run dev
npm run start
```

---

## Deployment (High Level)

Typical production layout:

- Nginx reverse proxy
- `web` served as static build
- `api` behind PHP-FPM
- `realtime` behind Nginx WebSocket proxy (Socket.IO)

Example routes:

- `https://your-domain.com` → web build
- `https://your-domain.com/api` → Laravel
- `https://your-domain.com/socket.io` → Node realtime (WebSocket upgrade)

If using Cloudflare, ensure WebSocket is enabled and your origin supports upgrade headers.

---

## Security

- Never commit `.env` files
- Rotate SMTP keys if leaked
- Use HTTPS in production
- Restrict DB/security groups/firewall to minimum required ports

---

## Contributing

- Create a feature branch: `git checkout -b feature/my-feature`
- Commit with clear message
- Open a PR

---

## License

Proprietary / Internal (update this section if you plan to open-source).
