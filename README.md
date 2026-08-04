# DevBlog — Full-Stack Blogging Platform

A modern, multi-user blogging system built with **Angular 17 (SSR)**, **Laravel 13**, **PostgreSQL**, and **Redis** — fully containerized with Docker, CI/CD on GitHub Actions, and code quality analysis via SonarCloud.

## Features

- **Server-Side Rendering (SSR)** — Angular Universal with route resolvers for SEO-friendly, pre-rendered pages
- **Session-based authentication** — Laravel Sanctum cookie-based auth with CSRF protection, single-session enforcement via dedicated `user_sessions` table
- **Role-based access control** — Admin, Author, and Reader roles via Spatie Laravel Permission
- **Dark mode** — System-aware, persisted in localStorage, toggle in navbar
- **Full-text search** — Debounced search with real-time filtering
- **Markdown rendering** — Post content rendered with `marked` library, styled with prose CSS
- **Threaded comments** — Nested replies with reply/delete actions
- **Comment moderation** — Admin panel to approve/unapprove/delete comments
- **Full CRUD for posts** — Create, edit, delete with category/tag assignment, draft/published status, featured image
- **Full CRUD for categories & tags** — Admin-only management via dedicated admin panels
- **Categories (N:N) & Tags (N:N)** — Filter posts by category or tag
- **User profiles** — Public profile pages with bio, avatar, and post history
- **Avatar upload** — Profile edit with file upload and preview
- **Reading time** — Automatic estimation on post detail
- **Share** — Web Share API with clipboard fallback
- **Skeleton loaders** — Shimmer animation during data loading
- **Responsive design** — Mobile-first with hamburger menu, Tailwind CSS
- **CI/CD** — 3-job pipeline: tests, lint, build, coverage, SonarCloud analysis
- **157 backend tests** (333 assertions) + **385 frontend tests** — all passing

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular (standalone, signals, SSR) | 17.3 |
| Styling | Tailwind CSS | 3.4 |
| Markdown | marked | 18 |
| Fonts | Inter + JetBrains Mono | — |
| Backend | Laravel | 13.23 |
| Runtime | PHP | 8.3 |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7.4 |
| Auth | Laravel Sanctum (cookie/session-based) | 4.3 |
| Roles | Spatie Laravel Permission | 8.3 |
| Images | Intervention Image | 4.2 |
| Reverse Proxy | Nginx | — |
| Container | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |
| Quality | SonarCloud | — |
| Testing (backend) | Pest PHP | 4.7 |
| Testing (frontend) | Karma + Jasmine | 6.4 |
| Static Analysis | PHPStan (Larastan) | Level 4 |
| Code Style | Laravel Pint | — |
| Frontend Lint | ESLint | 8 |
| Frontend Runtime | Node.js | 20 (via nvm) |

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
| `blog-nginx` | `nginx:alpine` | 8080 | Reverse proxy (`/api` → backend, `/` → frontend, `/sanctum` → backend) |
| `blog-frontend` | `node:20-alpine` (multi-stage build) | 4000 | Angular SSR production build served by Express |
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
make build
make up
```

The backend entrypoint automatically waits for the database, runs migrations, and clears config/route caches.

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
| Database | `bloging` |

## Demo Accounts

All accounts use the password `password`.

| Role | Email | Username | Can do |
|------|-------|----------|--------|
| **Admin** | `admin@example.com` | `admin` | Everything — manage posts, comments, categories, tags |
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
│   ├── php/Dockerfile              # PHP 8.3-FPM Alpine with entrypoint (wait-for-db + migrate)
│   ├── php/entrypoint.sh           # Wait for DB, run migrations, clear caches
│   ├── node/Dockerfile             # Node 20 multi-stage: build SSR → serve Express
│   └── nginx/default.conf          # Reverse proxy: /api → backend, /sanctum → backend, / → frontend
├── Makefile                        # Auto-detects docker compose vs docker-compose
├── backend/                        # Laravel 13 API
│   ├── app/
│   │   ├── Actions/               # 6 action classes (RegisterUser, LoginUser, LogoutUser, CreatePost, UpdatePost, UpdateProfile)
│   │   ├── Http/Controllers/Api/   # 8 controllers (Auth, Post, Category, Tag, Comment, User, UserPost, Profile)
│   │   ├── Http/Requests/Api/     # 11 form requests (all endpoints validated)
│   │   ├── Http/Resources/        # 5 resources (Post, Category, Tag, Comment, User)
│   │   ├── Middleware/            # EnsureSingleSession (dedicated user_sessions table)
│   │   ├── Models/                # 6 models (User, Post, Category, Tag, Comment, UserSession)
│   │   └── Policies/             # 4 policies (Post, Comment, Category, Tag)
│   ├── database/
│   │   ├── migrations/            # 11 migrations (users, posts, categories, tags, comments, pivots, permissions, tokens, user_sessions)
│   │   ├── factories/             # 6 factories with states
│   │   └── seeders/DatabaseSeeder.php
│   ├── routes/api.php             # 27 API endpoints
│   ├── routes/web.php             # Login route for Sanctum
│   ├── tests/
│   │   ├── Feature/               # 8 feature test files (157 tests, 333 assertions)
│   │   └── Unit/                  # 7 unit test files
│   └── phpstan.neon               # Larastan level 4
├── frontend/                       # Angular 17 SSR + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── guards/         # authGuard, authorGuard, adminGuard
│   │   │   │   ├── interceptors/   # authInterceptor (withCredentials for /api + /sanctum)
│   │   │   │   ├── models/         # 6 interfaces (User, Post, Category, Tag, Comment, Paginated)
│   │   │   │   ├── resolvers/      # 5 resolvers (posts, categories, tags, post, profile)
│   │   │   │   ├── services/       # 3 services (Auth, Blog, User)
│   │   │   │   └── tokens/         # API_URL injection token (SSR-aware)
│   │   │   ├── features/
│   │   │   │   ├── auth/           # login, register components
│   │   │   │   ├── blog/           # post-list, post-detail components
│   │   │   │   ├── profile/        # profile, profile-edit (avatar upload) components
│   │   │   │   └── admin/          # post-admin, post-form, category-admin, tag-admin, comment-admin components
│   │   │   ├── app.component.*     # Root with navbar, dark mode, mobile menu, admin links
│   │   │   ├── app.config.ts       # Browser providers (hydration, HTTP, interceptors, XSRF)
│   │   │   ├── app.config.server.ts# Server providers (SSR)
│   │   │   └── app.routes.ts       # 15 lazy-loaded routes with resolvers
│   │   ├── environments/           # Dev + prod environment configs
│   │   ├── styles.css             # Tailwind + custom components (dark mode, prose-content, glass, skeleton)
│   │   └── index.html             # Google Fonts (Inter, JetBrains Mono)
│   ├── tailwind.config.js         # Primary + accent colors, dark mode, animations
│   └── proxy.conf.json            # Dev proxy for /api
├── .github/workflows/ci.yml       # 3 CI jobs + security audit
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

### Auth (session-based, CSRF protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new reader (assigns role, creates session) |
| POST | `/api/auth/login` | Login (creates session, stores in user_sessions table) |
| POST | `/api/auth/logout` | Logout (clears session record) |
| GET | `/api/auth/me` | Get current authenticated user with roles |
| GET | `/api/auth/my-posts` | Get authenticated user's posts (all statuses, paginated) |
| GET | `/api/auth/my-posts/{post}` | Get single post by ID (owner or admin only) |

### Authenticated (`auth` + `single.session`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post (author/admin only) |
| PUT | `/api/posts/{post}` | Update post (owner or admin) |
| DELETE | `/api/posts/{post}` | Delete post (owner or admin) |
| POST | `/api/posts/{post}/comments` | Add comment (supports nested via `parent_id`) |
| DELETE | `/api/comments/{comment}` | Delete comment (owner or admin) |
| PUT | `/api/profile` | Update profile (name, username, bio, avatar upload) |

### Admin only (`auth` + `single.session` + role check)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments` | List all comments for moderation (paginated, with user+post) |
| PUT | `/api/comments/{comment}` | Approve/unapprove comment |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/{category}` | Update category |
| DELETE | `/api/categories/{category}` | Delete category |
| POST | `/api/tags` | Create tag |
| PUT | `/api/tags/{tag}` | Update tag |
| DELETE | `/api/tags/{tag}` | Delete tag |

## Session Management

The app uses a dedicated `user_sessions` table (instead of storing `session_id` on the `users` table — an anti-pattern). The `EnsureSingleSession` middleware enforces single-active-session: when a user logs in from another device, the old session is terminated with a 401 response.

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
make backend-test           # php artisan test (157 tests)
make backend-tinker         # php artisan tinker
make backend-artisan CMD="..."  # Run any artisan command

# Frontend
make frontend-install       # npm install
make frontend-test          # npm run test (385 tests)

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
docker-compose build --no-cache
docker-compose up -d
```

## Testing

### Backend (Pest PHP)

```bash
make backend-test
# or in Docker:
docker exec blog-backend php artisan test --no-coverage
```

- **157 tests**, 333 assertions, all passing
- PHPStan level 4: 0 errors
- Pint: PASS (98 files)
- Tests use SQLite in-memory with `CACHE_STORE=array`
- Factories with role states (`admin()`, `author()`, `reader()`)
- Feature tests cover all API endpoints, auth flow, session management, and edge cases
- Unit tests cover models, policies, and isolated logic

### Frontend (Karma + Jasmine)

```bash
make frontend-test
# or directly:
nvm use 20 && npm test
```

- **385 tests**, all passing
- 97.34% statement coverage, 85.2% branch coverage
- Headless Chrome (ChromeHeadlessNoSandbox for CI)
- `HttpTestingController` for all HTTP mocking
- Component tests for all features: auth, blog, profile, admin (posts, categories, tags, comments)
- ESLint: clean (0 errors)

### CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

| Job | Steps | Duration |
|-----|-------|----------|
| **Backend (Laravel)** | PHP 8.3 → composer install → Pest tests + coverage → PHPStan (Larastan L4) → Pint style check → upload coverage artifact | ~60s |
| **Frontend (Angular)** | Node 20 → npm ci → ESLint → Karma tests + coverage → SSR production build → upload coverage artifact | ~45s |
| **SonarQube Analysis** | Java 21 → download backend + frontend coverage → SonarCloud scan | ~55s |
| **Security Audit** | `composer audit` + `npm audit` (non-blocking, `continue-on-error: true`) | ~10s |

All jobs must pass for a green pipeline.

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
| `SESSION_DRIVER` | `redis` | Session storage (array in tests) |

#### Frontend SSR

| Variable | Value | Description |
|----------|---------|-------------|
| `SSR_API_URL` | `http://nginx:80/api` | Internal Docker URL for server-side API calls |

## License

This project is for portfolio/educational purposes.

## Links

- **Repository**: [github.com/AlexisChartier/blog-fullstack](https://github.com/AlexisChartier/blog-fullstack)
- **SonarCloud**: [sonarcloud.io/project/overview?id=AlexisChartier_blog-fullstack](https://sonarcloud.io/project/overview?id=AlexisChartier_blog-fullstack)
