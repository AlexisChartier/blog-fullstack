# DevBlog — Full-Stack Blogging Platform

A modern, multi-user blogging system built with **Angular 17 (SSR)**, **Laravel 11**, **PostgreSQL**, and **Redis** — fully containerized with Docker, CI/CD on GitHub Actions, and code quality analysis via SonarCloud.

## Features

- **Server-Side Rendering (SSR)** — Angular Universal with route resolvers for SEO-friendly, pre-rendered pages
- **Role-based access control** — Admin, Author, and Reader roles via Spatie Laravel Permission
- **Token-based authentication** — Laravel Sanctum tokens with localStorage persistence and session restore
- **Dark mode** — System-aware, persisted in localStorage, toggle in navbar
- **Full-text search** — Debounced search with real-time filtering
- **Threaded comments** — Nested replies (up to 3 levels deep) with reply/delete actions
- **CRUD for posts** — Create, edit, delete with category/tag assignment, draft/published status
- **Categories (N:N) & Tags (N:N)** — Filter posts by category or tag
- **User profiles** — Public profile pages with bio, avatar, and post history
- **Reading time** — Automatic estimation on post detail
- **Share** — Web Share API with clipboard fallback
- **Skeleton loaders** — Shimmer animation during data loading
- **Responsive design** — Mobile-first with hamburger menu, Tailwind CSS
- **CI/CD** — 3-job pipeline: tests, lint, build, coverage, SonarCloud analysis
- **97.6% test coverage** — 99 Pest PHP tests, 209 assertions

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular (standalone, signals, SSR) | 17 |
| Styling | Tailwind CSS | 3 |
| Fonts | Inter + JetBrains Mono | — |
| Backend | Laravel | 11 |
| Runtime | PHP | 8.3 |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Auth | Laravel Sanctum (token-based) | — |
| Roles | Spatie Laravel Permission | — |
| Images | Intervention Image | — |
| Reverse Proxy | Nginx | — |
| Container | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |
| Quality | SonarCloud | — |
| Testing | Pest PHP | 4 |
| Static Analysis | PHPStan (Larastan) | Level 4 |
| Code Style | Laravel Pint | — |
| Frontend Lint | ESLint | 8 |

## Architecture

```
Browser ──► Nginx (:8080) ──┬──► Laravel API (:9000 FPM) ──► PostgreSQL (:5432)
                            │                              └─► Redis (:6379)
                            └──► Angular SSR (:4000 Express)
                                    └─► SSR API calls ──► Nginx (:80)
```

Six Docker containers on a single bridge network:

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `blog-nginx` | `nginx:alpine` | 8080 | Reverse proxy (`/api` → backend, `/` → frontend) |
| `blog-frontend` | `node:22-alpine` (multi-stage build) | 4000 | Angular SSR production build served by Express |
| `blog-backend` | `php:8.3-fpm-alpine` | 9000 | Laravel API (FastCGI) |
| `blog-db` | `postgres:16-alpine` | 5432 | PostgreSQL database |
| `blog-redis` | `redis:7-alpine` | 6379 | Cache & sessions |
| `blog-adminer` | `adminer:latest` | 8081 | Database admin UI |

## Quick Start

### Prerequisites

- **Docker** (with Docker Compose or Colima)
- **Make** (pre-installed on macOS/Linux)

### One-command setup

```bash
git clone https://github.com/AlexisChartier/blog-fullstack.git
cd blog-fullstack
make dev
```

Then install dependencies and seed the database:

```bash
# Install backend dependencies
make backend-install

# Generate Laravel app key
make backend-artisan CMD="key:generate"

# Create storage symlink
make backend-artisan CMD="storage:link"

# Run migrations with seed data
make migrate-fresh
```

### Access the app

| Service | URL |
|---------|-----|
| **Application** | http://localhost:8080 |
| **API** | http://localhost:8080/api |
| **Adminer** (DB admin) | http://localhost:8081 |

### Adminer Credentials

| Field | Value |
|-------|-------|
| System | PostgreSQL |
| Server | `db` |
| Username | `blog` |
| Password | `secret` |
| Database | `blogging` |

## Demo Accounts

All accounts use the password `password`.

| Role | Email | Username | Can do |
|------|-------|----------|--------|
| **Admin** | `admin@example.com` | `admin` | Everything — manage all posts, comments, users |
| **Author** | `jane@example.com` | `jane_doe` | Create/edit/delete own posts, comment |
| **Author** | `alex@example.com` | `alex_chen` | Same as above |
| **Author** | `sarah@example.com` | `sarah_w` | Same as above |
| **Author** | `marcus@example.com` | `marcusj` | Same as above |
| **Author** | `emma@example.com` | `emma_r` | Same as above |
| **Author** | `liam@example.com` | `liamob` | Same as above |
| **Reader** | `reader@example.com` | `reader` | Comment, delete own comments |
| **Reader** | `chris@example.com` | `chris_r` | Same as above |
| **Reader** | `pat@example.com` | `patmorgan` | Same as above |

## Seed Data

The database is seeded with realistic developer-focused content:

| Entity | Count | Details |
|--------|-------|---------|
| Users | 10 | 1 admin, 6 named authors, 3 readers |
| Posts | 45 | 40 published + 5 drafts, real dev article titles |
| Categories | 12 | Web Dev, Backend, Frontend, DevOps, Security, Testing, etc. |
| Tags | 30 | laravel, angular, docker, kubernetes, typescript, etc. |
| Comments | ~600 | Threaded: top-level + nested replies (up to 3 levels) |

## Project Structure

```
blog-fullstack/
├── docker-compose.yml              # 6 services: db, redis, adminer, backend, frontend, nginx
├── docker/
│   ├── php/Dockerfile              # PHP 8.3-FPM Alpine (multi-ext, autoconf for pecl)
│   ├── node/Dockerfile             # Node 22 multi-stage: build SSR → serve Express
│   └── nginx/default.conf          # Reverse proxy: /api → backend, / → frontend
├── Makefile                        # Auto-detects docker compose vs docker-compose
├── backend/                        # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # 7 controllers (Auth, Post, Category, Tag, Comment, User, Profile)
│   │   ├── Http/Requests/Api/     # 4 form requests (Login, Register, StorePost, UpdatePost)
│   │   ├── Http/Resources/        # 5 resources (Post, Category, Tag, Comment, User)
│   │   ├── Models/                # 5 models with relations and scopes
│   │   └── Policies/             # 2 policies (Post, Comment)
│   ├── database/
│   │   ├── migrations/            # 10 migrations (users, posts, categories, tags, comments, pivots, permissions, tokens)
│   │   ├── factories/             # 5 factories with states (admin, author, reader, draft, unapproved)
│   │   └── seeders/DatabaseSeeder.php
│   ├── routes/api.php             # 17 API endpoints
│   ├── tests/                     # 99 Pest PHP tests (97.6% coverage)
│   └── phpstan.neon               # Larastan level 4
├── frontend/                       # Angular 17 SSR + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── guards/         # authGuard, authorGuard
│   │   │   │   ├── interceptors/   # authInterceptor (Bearer token)
│   │   │   │   ├── models/         # 6 interfaces (User, Post, Category, Tag, Comment, Paginated)
│   │   │   │   ├── resolvers/      # 5 resolvers (posts, categories, tags, post, profile)
│   │   │   │   ├── services/       # 3 services (Auth, Blog, User)
│   │   │   │   └── tokens/         # API_URL injection token (SSR-aware)
│   │   │   ├── features/
│   │   │   │   ├── auth/           # login, register components
│   │   │   │   ├── blog/           # post-list, post-detail components
│   │   │   │   ├── profile/        # profile, profile-edit components
│   │   │   │   └── admin/          # post-admin, post-form components
│   │   │   ├── app.component.*     # Root with navbar, dark mode, mobile menu
│   │   │   ├── app.config.ts       # Browser providers (hydration, HTTP, interceptors)
│   │   │   ├── app.config.server.ts# Server providers (SSR)
│   │   │   └── app.routes.ts       # 12 lazy-loaded routes with resolvers
│   │   ├── environments/           # Dev + prod environment configs
│   │   ├── styles.css             # Tailwind + custom components (dark mode)
│   │   └── index.html             # Google Fonts (Inter, JetBrains Mono)
│   ├── tailwind.config.js         # Primary + accent colors, dark mode, animations
│   └── proxy.conf.json            # Dev proxy for /api
├── .github/workflows/ci.yml       # 3 CI jobs
├── sonar-project.properties       # SonarCloud config
└── README.md
```

## API Endpoints

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List published posts (paginated 9/page, filterable by search/category/tag) |
| GET | `/api/posts/{slug}` | Single post with approved comments and author |
| GET | `/api/categories` | All categories with post count |
| GET | `/api/tags` | All tags with post count |
| GET | `/api/users/{username}` | User profile with latest 10 published posts |
| GET | `/api/users/{username}/posts` | Paginated posts by user |
| POST | `/api/auth/register` | Register new reader (returns token) |
| POST | `/api/auth/login` | Login (returns Sanctum token) |

### Authenticated (`auth:sanctum`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/logout` | Logout (revoke current token) |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/posts` | Create post (author/admin only) |
| PUT | `/api/posts/{post}` | Update post (owner or admin) |
| DELETE | `/api/posts/{post}` | Delete post (owner or admin) |
| POST | `/api/posts/{post}/comments` | Add comment (supports nested via `parent_id`) |
| DELETE | `/api/comments/{comment}` | Delete comment (owner or admin) |
| PUT | `/api/profile` | Update profile (name, username, bio, avatar) |

## Development

### Make commands

```bash
make help           # List all commands
make up             # Start all containers
make down           # Stop all containers
make build          # Build/rebuild containers
make logs           # Follow container logs
make ps             # Show running containers

# Backend
make backend-install        # composer install
make migrate                # php artisan migrate
make migrate-fresh          # migrate:fresh --seed (reset DB)
make seed                   # db:seed
make backend-test            # php artisan test (99 tests)
make backend-tinker         # php artisan tinker
make backend-artisan CMD="..."  # Run any artisan command

# Frontend
make frontend-install       # npm install
make frontend-test          # npm run test

# All
make test                   # backend + frontend tests
make dev                    # up + show URLs
```

### Rebuilding after changes

```bash
# After backend code changes (volume-mounted, no rebuild needed)
# After frontend code changes:
make build

# After Dockerfile/compose changes:
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## Testing

### Backend (Pest PHP)

```bash
make backend-test
```

- **99 tests**, 209 assertions, 97.6% coverage
- Tests use SQLite in-memory with `CACHE_STORE=array`
- Factories with role states (`admin()`, `author()`, `reader()`)
- Feature tests cover all API endpoints, auth flow, and edge cases

### Frontend

```bash
make frontend-test
```

- Karma + Jasmine
- Headless Chrome

### CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

| Job | Steps | Duration |
|-----|-------|----------|
| **Backend (Laravel)** | PHP 8.3 → composer install → Pest tests + coverage → PHPStan (Larastan L4) → Pint style check → upload coverage artifact | ~60s |
| **Frontend (Angular)** | Node 22 → npm ci → ESLint → SSR production build | ~35s |
| **SonarQube Analysis** | Java 21 → download backend coverage → SonarCloud scan | ~55s |

All three jobs must pass for a green pipeline.

## Configuration

### Environment Variables

#### `docker-compose.yml` (defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `blogging` | Database name |
| `POSTGRES_USER` | `blog` | Database user |
| `POSTGRES_PASSWORD` | `secret` | Database password |
| `NGINX_PORT` | `8080` | Public HTTP port |
| `ADMINER_PORT` | `8081` | Adminer port |
| `FRONTEND_PORT` | `4000` | Direct SSR port (nginx proxies to this) |

#### `backend/.env`

| Key | Value | Notes |
|-----|-------|-------|
| `DB_HOST` | `db` | Docker service name |
| `REDIS_HOST` | `redis` | Docker service name |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost,localhost:8080,...` | CORS origins |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:8080,...` | Allowed origins for API |

#### Frontend SSR

| Variable | Value | Description |
|----------|-------|-------------|
| `SSR_API_URL` | `http://nginx:80/api` | Internal Docker URL for server-side API calls |

## License

This project is for portfolio/educational purposes.

## Links

- **Repository**: [github.com/AlexisChartier/blog-fullstack](https://github.com/AlexisChartier/blog-fullstack)
- **SonarCloud**: [sonarcloud.io/project/overview?id=AlexisChartier_blog-fullstack](https://sonarcloud.io/project/overview?id=AlexisChartier_blog-fullstack)
