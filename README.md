# Multi-User Blogging System

Full-stack blogging platform built with **Angular 17 (SSR)** + **Laravel 11** + **PostgreSQL** + **Redis**.

## Features

- Server-Side Rendering (SSR) for SEO
- Multi-user authentication with roles (admin, author, reader)
- CRUD operations for blog posts
- Nested commenting system
- Categories (N:N) and tags
- User profile pages
- Redis caching
- Full Docker containerization
- CI/CD with GitHub Actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, Tailwind CSS, SSR |
| Backend | Laravel 11, PHP 8.3 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | Laravel Sanctum (cookie-based, SSR-compatible) |
| Roles | Spatie Laravel Permission |
| Images | Intervention Image |
| Container | Docker + Nginx reverse proxy |
| CI | GitHub Actions |

## Quick Start

```bash
# 1. Clone and enter the project
cd project1

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Start containers
make up

# 4. Install dependencies
make backend-install
make frontend-install

# 5. Generate app key
make backend-artisan CMD="key:generate"

# 6. Run migrations and seed
make migrate-fresh

# 7. Visit the app
# Frontend:  http://localhost:8080
# API:       http://localhost:8080/api
# Adminer:   http://localhost:8081
```

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password |
| Author | (seeded) | password |
| Reader | reader@example.com | password |

## Project Structure

```
project1/
├── docker-compose.yml
├── docker/
│   ├── php/Dockerfile
│   ├── node/Dockerfile
│   └── nginx/default.conf
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Requests/Api/
│   │   ├── Http/Resources/
│   │   ├── Models/
│   │   └── Policies/
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   └── seeders/
│   └── routes/api.php
├── frontend/                   # Angular 17 + SSR
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── blog/
│   │   │   │   ├── profile/
│   │   │   │   └── admin/
│   │   │   └── shared/
│   │   └── server.ts
│   └── tailwind.config.js
├── .github/workflows/ci.yml
└── Makefile
```

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List published posts (paginated, filterable) |
| GET | `/api/posts/{slug}` | Single post with comments |
| GET | `/api/categories` | All categories |
| GET | `/api/tags` | All tags |
| GET | `/api/users/{username}` | Public profile |

### Auth (Sanctum)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |

### Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post (author/admin) |
| PUT | `/api/posts/{id}` | Update post (owner/admin) |
| DELETE | `/api/posts/{id}` | Delete post (owner/admin) |
| POST | `/api/posts/{id}/comments` | Add comment |
| DELETE | `/api/comments/{id}` | Delete comment (owner/admin) |
| PUT | `/api/profile` | Update profile |

## Development

```bash
make up          # Start containers
make down        # Stop containers
make logs        # View logs
make test        # Run all tests
make backend-test  # Laravel tests
make frontend-test # Angular tests
make migrate     # Run migrations
make seed        # Seed database
make help        # See all commands
```

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

**Backend:**
- PHP 8.3 + PostgreSQL 16 + Redis 7 services
- `php artisan test`
- PHPStan (Larastan) static analysis
- Laravel Pint code style

**Frontend:**
- Node 22
- ESLint
- SSR build
