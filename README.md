# ServiMe

**ServiMe** is an open-source, full-stack service marketplace platform that connects customers seeking home and professional services with companies that offer them through local branches.

## Features

- **Service request lifecycle** — customers create requests that move through `PENDING → ASSIGNED → IN_PROGRESS → COMPLETED / CANCELLED`
- **Company & branch management** — companies register, add branches, define service catalogs, and manage departments with operating hours
- **In-app messaging** — real-time conversations between customers and company representatives
- **Geolocation discovery** — find nearby branches using Google Maps integration
- **File uploads** — images, PDFs, and spreadsheets stored in AWS S3
- **Three independent frontends** — Customer dashboard, Company management panel, and a public marketing homepage
- **JWT authentication** — separate flows for admin users, company staff, and end customers
- **Email workflows** — password reset and notifications via SMTP with HTML templates
- **OpenAPI / Swagger** — auto-generated interactive API docs at `/docs`
- **Fully containerised** — one-command startup with Docker Compose

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.12+, FastAPI, SQLModel, Alembic |
| **Database** | PostgreSQL 17 |
| **Authentication** | JWT (HS256) + bcrypt |
| **File storage** | AWS S3 (boto3) |
| **Customer frontend** | React 18, Vite, TanStack Router, TanStack Query, Chakra UI |
| **Company frontend** | React 18, Vite, TanStack Router, TanStack Query, Chakra UI |
| **Homepage** | React 18, Vite, React Router v6, Tailwind CSS, shadcn/ui |
| **Reverse proxy** | Traefik (dev and production) |
| **Containerisation** | Docker Compose |
| **E2E tests** | Playwright |
| **Backend tests** | Pytest |
| **Linting** | Ruff, mypy, Biome |

---

## Project Structure

```
ServiMe/
├── backend/          # FastAPI application (Python)
├── frontend/         # Customer dashboard (React + Chakra UI)
├── frontend_company/ # Company management panel (React + Chakra UI)
├── homepage/         # Public marketing page (React + Tailwind)
├── docker-compose.yml           # Production base
├── docker-compose.override.yml  # Local development overrides
├── .env.example                 # All required environment variables
└── scripts/          # Build, deploy, and test helpers
```

---

## Fork & Clone

### Option 1 — Fork on GitHub

Click **Fork** at the top-right of this page, then clone your fork:

```bash
git clone https://github.com/<your-username>/ServiMe.git
cd ServiMe
```

### Option 2 — Clone directly

```bash
git clone https://github.com/dxavsoul/ServiMe.git
cd ServiMe
```

### Option 3 — Private fork (mirrors the repo under a new name)

```bash
# Clone the source
git clone https://github.com/dxavsoul/ServiMe.git my-project
cd my-project

# Point origin to your new private repo
git remote set-url origin git@github.com:<your-username>/my-project.git

# Keep upstream for future updates
git remote add upstream https://github.com/dxavsoul/ServiMe.git

git push -u origin main
```

To pull upstream changes later:

```bash
git pull --no-commit upstream main
# resolve conflicts if any
git merge --continue
```

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) v2+
- A Google Maps API key (for map features)
- *(Optional)* An AWS S3 bucket (for file uploads)
- *(Optional)* An SMTP provider (for emails; MailCatcher is used locally)

---

## Getting Started

### 1. Copy and configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values (marked with `🔴`):

| Variable | Description |
|---|---|
| `SECRET_KEY` | Generate with `openssl rand -base64 32` |
| `FIRST_SUPERUSER` | Admin email for the first login |
| `FIRST_SUPERUSER_PASSWORD` | Admin password |
| `POSTGRES_PASSWORD` | Database password |
| `GOOGLE_MAPS_API_KEY` | From [Google Cloud Console](https://console.cloud.google.com/) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 credentials (optional) |
| `SMTP_*` | Email settings (optional; MailCatcher works locally) |

> You can skip the AWS and SMTP variables to start — file uploads and emails will be disabled until they are set.

### 2. Start all services (with hot-reload)

```bash
docker compose watch
```

This starts every service with live file-sync so changes in `./backend` and the frontend folders are reflected immediately without rebuilding.

### 3. Open the app

| URL | Service |
|---|---|
| http://localhost:5173 | Customer frontend |
| http://localhost:5174 | Company management panel |
| http://localhost:8000/docs | Backend API — Swagger UI |
| http://localhost:8000/redoc | Backend API — ReDoc |
| http://localhost:8080 | Adminer (database browser) |
| http://localhost:8090 | Traefik dashboard |
| http://localhost:1080 | MailCatcher (email preview) |

Log in with the credentials you set in `FIRST_SUPERUSER` / `FIRST_SUPERUSER_PASSWORD`.

---

## Running Services Individually (without Docker)

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Run migrations
alembic upgrade head

# Seed initial data
python app/initial_data.py

# Start the API server (hot-reload)
fastapi dev app/main.py
```

The API will be available at http://localhost:8000.

### Customer Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Company Frontend

```bash
cd frontend_company
npm install
npm run dev        # http://localhost:5174
```

### Homepage

```bash
cd homepage
npm install
npm run dev
```

---

## Useful Commands

```bash
# Run backend tests
docker compose exec backend bash scripts/test.sh

# Run E2E tests (Playwright)
docker compose run --rm playwright npx playwright test

# Re-generate the typed API client (after backend changes)
bash scripts/generate-client.sh

# Lint & format backend
docker compose exec backend bash scripts/format.sh
docker compose exec backend bash scripts/lint.sh
```

---

## Deployment

See [deployment.md](./deployment.md) for full production deployment instructions using Docker Compose + Traefik with automatic HTTPS (Let's Encrypt).

The key steps are:

1. Point your domain's DNS to the server
2. Set `DOMAIN`, `ENVIRONMENT=production`, and all secrets in `.env`
3. Run `docker compose -f docker-compose.yml up -d`

---

## Environment Variables Reference

All variables are documented in [.env.example](./.env.example). Critical ones to change before going to production:

```bash
# Security
SECRET_KEY=                    # openssl rand -base64 32
FIRST_SUPERUSER_PASSWORD=      # strong password
POSTGRES_PASSWORD=             # strong password

# Domain
DOMAIN=yourdomain.com
ENVIRONMENT=production

# External services
GOOGLE_MAPS_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a Pull Request

Please run linting and tests before submitting:

```bash
docker compose exec backend bash scripts/lint.sh
docker compose exec backend bash scripts/test.sh
```

---

## License

Licensed under the [MIT License](./LICENSE).
