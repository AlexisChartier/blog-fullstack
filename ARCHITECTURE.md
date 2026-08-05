# Architecture Documentation — Multi-User Blogging System

Full-stack blog with Angular 17 SSR + Laravel 13 + PostgreSQL 16 + Redis 7.4, orchestrated with Docker.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Docker Architecture](#2-docker-architecture)
3. [Nginx Reverse Proxy](#3-nginx-reverse-proxy)
4. [Authentication & Sessions](#4-authentication--sessions)
5. [Roles & Permissions](#5-roles--permissions)
6. [Database Schema](#6-database-schema)
7. [API Mapping (Frontend ↔ Backend)](#7-api-mapping-frontend--backend)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Comment Nesting](#9-comment-nesting)
10. [Testing Strategy](#10-testing-strategy)
11. [Key Flows](#11-key-flows)

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Laravel | 13.23 |
| Backend | PHP | 8.3 |
| Backend | Pest PHP (testing) | 4.7 |
| Backend | Spatie Permission | 8.3 |
| Backend | Sanctum (SPA auth) | 4.3 |
| Frontend | Angular | 17.3 |
| Frontend | Node.js | 20 (dev) / 22 (Docker) |
| Frontend | Tailwind CSS | 3.4 |
| Frontend | marked (Markdown) | 18 |
| Database | PostgreSQL | 16 |
| Cache/Sessions | Redis | 7.4 |
| Reverse Proxy | Nginx | Alpine |
| CI | GitHub Actions | — |
| Quality | SonarCloud | — |

---

## 2. Docker Architecture

**File:** `docker-compose.yml`

Six services on a single `blog-network` bridge network:

```
                    Browser (:8080)
                         │
                    ┌────▼────┐
                    │  nginx  │  Reverse proxy
                    └──┬──┬───┘
           /api, /sanctum  │  everything else
              /storage    │
               ┌──────────▼──┐    ┌──────────▼──┐
               │   backend   │    │  frontend  │
               │  (PHP-FPM)  │    │ (Angular   │
               │    :9000    │    │    SSR)    │
               └──────┬──────┘    │   :4000    │
                      │           └────────────┘
              ┌───────┴───────┐
              │               │
         ┌────▼────┐    ┌────▼────┐
         │  pgsql  │    │  redis  │
         │  :5432  │    │  :6379  │
         └─────────┘    └─────────┘
```

| Service | Container | Port | Image | Volumes |
|---------|-----------|------|-------|---------|
| `db` | `blog-db` | 5432 | `postgres:16-alpine` | `pgdata` (persistent) |
| `redis` | `blog-redis` | 6379 | `redis:7-alpine` | `redisdata` (persistent) |
| `adminer` | `blog-adminer` | 8081→8080 | `adminer:latest` | — |
| `backend` | `blog-backend` | (internal) | Custom PHP 8.3 FPM | `./backend:/var/www/html` |
| `frontend` | `blog-frontend` | 4000 | Custom Node 22 | — |
| `nginx` | `blog-nginx` | 8080→80 | `nginx:alpine` | config + `./backend` |

**Backend Dockerfile** (`docker/php/Dockerfile`): PHP 8.3 FPM Alpine with `pdo_pgsql`, `gd`, `intl`, `zip`, `mbstring`, `bcmath`, `opcache`, Redis extension, and Xdebug (coverage). Entrypoint waits for DB, runs migrations, clears caches, starts `php-fpm`.

**Frontend Dockerfile** (`docker/node/Dockerfile`): Multi-stage build. Stage 1: `npm install` → `npm run build`. Stage 2: copies `dist/frontend` + `node_modules` → runs `npm run serve:ssr` on port 4000. Receives `SSR_API_URL=http://nginx:80/api` for server-side requests over the Docker network.

---

## 3. Nginx Reverse Proxy

**File:** `docker/nginx/default.conf`

A single server block on port 80 with `client_max_body_size 20M`:

| Location | Target | Purpose |
|----------|--------|---------|
| `/api` | `backend:9000` (FastCGI) | Laravel API endpoints |
| `/sanctum` | `backend:9000` (FastCGI) | Sanctum CSRF cookie endpoint |
| `/storage` | `backend:9000` (FastCGI) | Laravel public file storage |
| `~ \.php$` | `backend:9000` (FastCGI) | PHP-FPM handler |
| `/` | `http://frontend:4000` (proxy_pass) | Angular SSR — all non-API traffic |

**Key design:** SPA and API share the same origin (`localhost:8080`), eliminating CORS issues for cookie-based auth. Proxy headers (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`) are forwarded. WebSocket upgrade headers support SSR HMR.

---

## 4. Authentication & Sessions

### Cookie-Based Auth (Sanctum SPA)

The app uses **Sanctum's SPA authentication** — session cookies, not bearer tokens. The `personal_access_tokens` table exists but is not used for SPA auth.

**Configuration:**

- `backend/bootstrap/app.php`: `$middleware->statefulApi()` adds session + CSRF middleware to API routes
- `backend/config/sanctum.php`: Stateful domains from `SANCTUM_STATEFUL_DOMAINS` env (includes `localhost:8080`)
- `backend/config/cors.php`: `supports_credentials: true`, allowed origins from env
- `backend/config/session.php`: Driver `redis`, lifetime 120 min, cookie `blog-session`, same-site `lax`
- `backend/config/auth.php`: Default guard `web` (session-based, Eloquent user provider)

**Frontend configuration:**

- `frontend/src/app/app.config.ts`: `withInterceptors([authInterceptor])` + `withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })` + `withFetch()` (SSR-compatible)
- `frontend/src/app/core/interceptors/auth.interceptor.ts`: Adds `withCredentials: true` to all `/api` and `/sanctum` requests. Catches 401 (non-login/register) → calls `auth.logout()` → redirects to `/login?session=expired`

### Session Management — Single Session Enforcement

**One active session per user.** If a user logs in on a second device, the first session is terminated.

**`user_sessions` table** (PostgreSQL): Maps `user_id` → `session_id`. The actual session data lives in Redis, but this table tracks which session ID is "active."

**`EnsureSingleSession` middleware** (alias `single.session`):

```
Request arrives → after response is sent:
  1. Get current session ID from request
  2. Query user_sessions for stored active session
  3. If stored session_id ≠ current session_id:
     → User logged in elsewhere → Auth::logout(), return 401
  4. If no stored session or first login:
     → Delete old user_sessions, create new record
```

**`LoginUser` action**: Deletes old `user_sessions` for user → creates new record with new session ID → this triggers session termination on other devices.

**`LogoutUser` action**: Deletes `user_sessions` rows → `Auth::logout()` → invalidate session → regenerate CSRF token.

**`User` model**: `activeSession(): HasOne` → `hasOne(UserSession::class)->latestOfMany()`

### Auth Service (Frontend)

**File:** `frontend/src/app/core/services/auth.service.ts`

Uses Angular **signals** for reactive state:

```typescript
private readonly _user = signal<User | null>(null);
private readonly _sessionChecked = signal(false);
readonly isAuthenticated = signal(false);
```

**Session restoration** (on page load):
1. `restoreSession()` called in constructor
2. If SSR (`window === undefined`): immediately `sessionChecked = true` (no cookies on server)
3. If browser: `GET /api/auth/me` → success: set user + `isAuthenticated = true`; error: `isAuthenticated = false`; either way: `sessionChecked = true`

**Route guards** wait for `sessionChecked()` before deciding — prevents auth flash on page load.

**CSRF**: `ensureCsrfCookie()` calls `GET /sanctum/csrf-cookie` before login/register. Angular's `withXsrfConfiguration` automatically reads `XSRF-TOKEN` cookie and sends it as `X-XSRF-TOKEN` header.

### API URL Injection

**File:** `frontend/src/app/core/tokens/api-url.token.ts`

- **SSR**: `process.env.SSR_API_URL` → `http://nginx:80/api` (internal Docker URL)
- **Browser**: `/api` (relative path, same origin via nginx proxy)

---

## 5. Roles & Permissions

**Package:** Spatie Permission (`spatie/laravel-permission`)

### Three Roles

| Role | Permissions | Notes |
|------|------------|-------|
| `admin` | All permissions | Inherits author privileges |
| `author` | Create/edit/delete own posts, create/delete own comments | Can write content |
| `reader` | Create/delete own comments | Default for new registrations |

### Role Hierarchy

Both backend and frontend treat admins as authors:

- **Backend** (`User.php`): `isAuthor()` returns `hasRole('admin') || hasRole('author')`
- **Frontend** (`auth.service.ts`): `hasRole('author')` returns `roles.includes('admin') || roles.includes('author')`

### Role Serialization

`UserResource` returns roles as string arrays: `['admin']`, not objects. `AuthController` uses `UserResource::make($user->load('roles'))` for all auth endpoints (register, login, me). This ensures the frontend `hasRole()` method works correctly.

### Permissions (seeded)

```
admin:  all permissions
author: create posts, edit own posts, delete own posts, create comments, delete own comments
reader: create comments, delete own comments
```

### Frontend Guards

**File:** `frontend/src/app/core/guards/auth.guard.ts`

| Guard | Condition | Redirect |
|-------|-----------|----------|
| `authGuard` | `isAuthenticated()` | `/login` |
| `authorGuard` | `isAuthenticated() && hasRole('author')` | `/` |
| `adminGuard` | `isAuthenticated() && hasRole('admin')` | `/` |

All guards wait for `sessionChecked()` before evaluating (async session restoration).

---

## 6. Database Schema

### Core Tables

**`users`** — `id`, `name`, `username` (unique), `email` (unique), `password` (hashed), `avatar_url`, `bio`, `email_verified_at`, `remember_token`, timestamps

**`posts`** — `id`, `title`, `slug` (unique), `excerpt`, `content` (longText), `featured_image`, `status` (draft/published), `author_id` (FK→users, cascade), `published_at`, timestamps. Indexes: `[status, published_at]`, `author_id`

**`categories`** — `id`, `name`, `slug` (unique), `description`, timestamps

**`tags`** — `id`, `name`, `slug` (unique), timestamps

**`category_post`** — Pivot: `post_id` (FK→posts, cascade), `category_id` (FK→categories, cascade). Composite PK: `(post_id, category_id)`

**`post_tag`** — Pivot: `post_id` (FK→posts, cascade), `tag_id` (FK→tags, cascade). Composite PK: `(post_id, tag_id)`

**`comments`** — `id`, `post_id` (FK→posts, cascade), `user_id` (FK→users, cascade), `parent_id` (FK→comments, self-referencing, nullable, cascade), `content`, `is_approved` (default false), timestamps. Indexes: `[post_id, is_approved]`, `parent_id`

### Auth & Session Tables

**`user_sessions`** — `id`, `user_id` (FK→users, cascade), `session_id` (string, unique), timestamps

**Spatie Permission tables** — `permissions`, `roles`, `model_has_permissions`, `model_has_roles`, `role_has_permissions` (standard Spatie schema)

**`personal_access_tokens`** — Sanctum token storage (exists but not used for SPA auth)

### Infrastructure

- `cache` + `cache_locks` — Laravel cache infrastructure
- `jobs` + `job_batches` + `failed_jobs` — Laravel queue infrastructure

---

## 7. API Mapping (Frontend ↔ Backend)

### Public Routes (no auth)

| Frontend Service | Method | Endpoint | Backend Controller |
|-----------------|--------|----------|-------------------|
| `BlogService.getPosts()` | GET | `/api/posts?page=N&search=&category=&tag=` | `PostController@index` |
| `BlogService.getPost()` | GET | `/api/posts/{slug}` | `PostController@show` |
| `BlogService.getCategories()` | GET | `/api/categories` | `CategoryController@index` |
| `BlogService.getTags()` | GET | `/api/tags` | `TagController@index` |
| `UserService.getUser()` | GET | `/api/users/{username}` | `UserController@show` |
| `UserService.getUserPosts()` | GET | `/api/users/{username}/posts?page=N` | `UserPostController@index` |

### Auth Routes

| Frontend Service | Method | Endpoint | Backend Controller | Auth |
|-----------------|--------|----------|-------------------|------|
| `AuthService.register()` | POST | `/api/auth/register` | `AuthController@register` | No |
| `AuthService.login()` | POST | `/api/auth/login` | `AuthController@login` | No |
| `AuthService.logout()` | POST | `/api/auth/logout` | `AuthController@logout` | Yes |
| `AuthService.fetchUser()` | GET | `/api/auth/me` | `AuthController@me` | Yes |
| `BlogService.getMyPosts()` | GET | `/api/auth/my-posts?page=N` | `AuthController@myPosts` | Yes |
| `BlogService.getMyPost()` | GET | `/api/auth/my-posts/{id}` | `AuthController@myPost` | Yes |

### Authenticated Routes (web + auth + single.session)

| Frontend Service | Method | Endpoint | Backend Controller | Admin? |
|-----------------|--------|----------|-------------------|--------|
| `BlogService.createPost()` | POST | `/api/posts` | `PostController@store` | No |
| `BlogService.updatePost()` | PUT | `/api/posts/{id}` | `PostController@update` | No (owner/admin) |
| `BlogService.deletePost()` | DELETE | `/api/posts/{id}` | `PostController@destroy` | No (owner/admin) |
| `BlogService.addComment()` | POST | `/api/posts/{id}/comments` | `CommentController@store` | No |
| `BlogService.deleteComment()` | DELETE | `/api/comments/{id}` | `CommentController@destroy` | No (owner/admin) |
| `BlogService.getComments()` | GET | `/api/comments?page=N` | `CommentController@index` | Yes |
| `BlogService.updateComment()` | PUT | `/api/comments/{id}` | `CommentController@update` | Yes |
| `BlogService.createCategory()` | POST | `/api/categories` | `CategoryController@store` | Yes |
| `BlogService.updateCategory()` | PUT | `/api/categories/{id}` | `CategoryController@update` | Yes |
| `BlogService.deleteCategory()` | DELETE | `/api/categories/{id}` | `CategoryController@destroy` | Yes |
| `BlogService.createTag()` | POST | `/api/tags` | `TagController@store` | Yes |
| `BlogService.updateTag()` | PUT | `/api/tags/{id}` | `TagController@update` | Yes |
| `BlogService.deleteTag()` | DELETE | `/api/tags/{id}` | `TagController@destroy` | Yes |
| `ProfileService.update()` | PUT | `/api/profile` | `ProfileController@update` | No (own profile) |
| `BlogService.getAdminStats()` | GET | `/api/admin/stats` | `AdminStatsController` (invokable) | Yes |
| `BlogService.getAllPosts()` | GET | `/api/admin/posts?page=N` | `AdminPostController@index` | Yes |
| `BlogService.getUsers()` | GET | `/api/admin/users?page=N` | `AdminUserController@index` | Yes |
| `BlogService.updateUserRole()` | PUT | `/api/admin/users/{id}/role` | `AdminUserController@updateRole` | Yes |

### Frontend Routes (Angular)

| Route | Component | Guard | Description |
|-------|-----------|-------|-------------|
| `/` | `PostListComponent` | — | Home with search, filters, pagination |
| `/post/:slug` | `PostDetailComponent` | — | Post detail with nested comments |
| `/category/:slug` | `PostListComponent` | — | Posts filtered by category |
| `/tag/:slug` | `PostListComponent` | — | Posts filtered by tag |
| `/profile/:username` | `ProfileComponent` | — | Public user profile |
| `/login` | `LoginComponent` | — | Login form |
| `/register` | `RegisterComponent` | — | Registration form |
| `/settings/profile` | `ProfileEditComponent` | `authGuard` | Edit own profile (avatar upload) |
| `/admin` | `AdminDashboardComponent` | `adminGuard` | Admin dashboard with stats |
| `/admin/posts` | `PostAdminComponent` | `authorGuard` | My posts (author's own) |
| `/admin/posts/all` | `AllPostsComponent` | `adminGuard` | All posts (all authors, admin only) |
| `/admin/posts/new` | `PostFormComponent` | `authorGuard` | Create new post |
| `/admin/posts/:id/edit` | `PostFormComponent` | `authorGuard` | Edit post |
| `/admin/categories` | `CategoryAdminComponent` | `adminGuard` | Category CRUD |
| `/admin/tags` | `TagAdminComponent` | `adminGuard` | Tag CRUD |
| `/admin/comments` | `CommentAdminComponent` | `adminGuard` | Comment moderation |
| `/admin/users` | `UserAdminComponent` | `adminGuard` | User management (role changes) |

---

## 8. Frontend Architecture

### Standalone Components + Signals

All components are **standalone** (no NgModules). State management uses Angular **signals** (`signal()`, `computed()`, `effect()`).

### Dependency Injection

Services use `inject()` (not constructor injection):
```typescript
private readonly blogService = inject(BlogService);
private readonly http = inject(HttpClient);
```

### Key Services

| Service | Responsibility |
|---------|---------------|
| `AuthService` | Auth state (signals), login/register/logout, session restoration, role checking |
| `BlogService` | All blog data: posts, categories, tags, comments, admin stats/posts/users |
| `UserService` | User profile data |

### Resolvers

**File:** `frontend/src/app/core/resolvers/blog.resolvers.ts`

Pre-fetches data before route navigation:
- `postsResolver` — loads paginated posts (with query params for category/tag/search)
- `categoriesResolver` — loads all categories
- `tagsResolver` — loads all tags
- `postResolver` — loads single post by slug
- `profileResolver` — loads user profile by username

### SSR (Server-Side Rendering)

- `provideClientHydration()` in `app.config.ts` — seamless hydration, no flicker
- `API_URL` token switches between Docker internal URL (SSR) and relative path (browser)
- `AuthService.restoreSession()` skips HTTP call during SSR (`window === undefined`)
- `withFetch()` — uses Fetch API instead of XHR (SSR-compatible)

### Navbar Role-Based Rendering

| User Type | Desktop Nav | Dropdown Menu |
|-----------|-------------|---------------|
| Admin | Home, Dashboard→`/admin` | Dashboard, All Posts, New Post, Users, Categories, Tags, Comments, Logout |
| Author | Home, Dashboard→`/admin/posts` | My Posts, New Post, Logout |
| Reader | Home | Logout |
| Guest | Home | Login, Get Started |

---

## 9. Comment Nesting

Comments support **one level of nesting** (top-level comments + replies).

### Backend

**`PostController::show()`** eager-loads comments with nested replies:

```php
'comments' => fn ($q) => $q
    ->approved()
    ->whereNull('parent_id')           // Only top-level comments
    ->with([
        'user:id,name,username,avatar_url',
        'replies' => fn ($rq) => $rq    // Eager-load replies
            ->approved()
            ->with('user:id,name,username,avatar_url')
            ->orderBy('created_at'),
    ])
    ->orderByDesc('created_at'),
```

**`CommentResource`** recursively serializes replies:
```php
'replies' => CommentResource::collection($this->whenLoaded('replies')),
```

**`CommentController::store()`** accepts `parent_id` for replies. **`StoreCommentRequest`** validates that `parent_id` exists and belongs to the same post.

### Frontend

`PostDetailComponent` renders top-level comments with `*ngFor`, then nested replies with a separate `*ngFor` inside each comment block, guarded by `*ngIf="comment.replies?.length"`.

---

## 10. Testing Strategy

### Backend (Pest PHP)

```
Backend: 168 tests, 368 assertions
```

| Test File | Coverage |
|-----------|---------|
| `AuthTest.php` | Registration, login, logout, session management, my-posts endpoints |
| `PostTest.php` | Post CRUD, search, filter, pagination |
| `CommentTest.php` | Comment creation, deletion, moderation (admin) |
| `CategoryTagTest.php` | Category/Tag CRUD, authorization |
| `AdminTest.php` | Admin stats, all posts, user list, role update |
| `EnsureSingleSessionTest.php` | Single session enforcement |
| Unit tests | Models, policies, factories |

**Quality gates:** Pint (code style), PHPStan level 4, coverage 99.2% (Clover format for SonarCloud).

### Frontend (Karma + Jasmine)

```
Frontend: 403 tests
Coverage: 97.34% statements, 85.2% branches
```

| Spec Pattern | Description |
|-------------|-------------|
| `HttpTestingController` | Mock HTTP requests, verify endpoints and payloads |
| `fakeAsync` + `tick()` | Test async operations (HTTP subscriptions) |
| `RouterTestingModule` | Test components with `routerLink` |
| Signal assertions | `expect(component.posts()).toEqual(...)` |

**Quality gates:** ESLint, build (SSR), coverage (lcov for SonarCloud).

### CI Pipeline (GitHub Actions)

**File:** `.github/workflows/ci.yml`

```
backend → tests + coverage + PHPStan + Pint
frontend → lint + build + tests + coverage
security-audit → composer audit + npm audit (non-blocking)
sonarqube → downloads coverage artifacts → SonarCloud scan
```

---

## 11. Key Flows

### Registration

```
1. Frontend: GET /sanctum/csrf-cookie → sets XSRF-TOKEN cookie
2. Frontend: POST /api/auth/register {name, username, email, password, password_confirmation}
3. Backend: RegisterUser action:
   a. Create User record
   b. assignRole('reader')
   c. Auth::login($user)
   d. Regenerate session
   e. Create UserSession record (user_id → session_id)
4. Backend: Returns 201 { message, user: UserResource } + Set-Cookie: blog-session
5. Frontend: Set user signal, isAuthenticated=true, navigate('/')
```

### Login

```
1. Frontend: GET /sanctum/csrf-cookie
2. Frontend: POST /api/auth/login {email, password}
3. Backend: LoginUser action:
   a. Auth::attempt(email, password)
   b. Regenerate session
   c. Delete old UserSession records
   d. Create new UserSession (user_id → new session_id)
4. Backend: Returns 200 { message, user: UserResource } + Set-Cookie: blog-session
5. Frontend: Set user signal, isAuthenticated=true, navigate('/')
```

### Session Restoration (page load)

```
1. AuthService constructor → restoreSession()
2. If SSR: sessionChecked=true immediately (no cookies on server)
3. If browser: GET /api/auth/me (with session cookie)
   - 200 → set user signal, isAuthenticated=true
   - 401 → isAuthenticated=false
   - Either way: sessionChecked=true
4. Route guards wait for sessionChecked() before allowing navigation
```

### Single Session Enforcement

```
Device A logged in (session_id=S1, stored in user_sessions)
User logs in on Device B:
  → LoginUser deletes S1 record, creates S2 record

Device A makes next API request (session_id=S1):
  → EnsureSingleSession middleware (runs after response):
    - activeSession.session_id = S2 ≠ currentSessionId = S1
    - Auth::logout(), invalidate session
    - Returns 401 "Your session has been terminated because you logged in from another device."

Frontend interceptor catches 401:
  → auth.logout(), redirect to /login?session=expired
```

### Comment Reply Flow

```
1. User clicks "Reply" on a comment → startReply(commentId)
2. Reply form appears with textarea
3. User types reply and clicks "Reply" → submitReply(parentId)
4. Frontend: POST /api/posts/{postId}/comments { content, parent_id: parentId }
5. Backend: CommentController@store creates Comment with parent_id
6. Frontend: Reloads post via loadPost(slug) → GET /api/posts/{slug}
7. Backend: PostController::show returns comments with nested replies
8. Frontend: Renders top-level comments + nested replies (one level)
```

### Admin Role Check Flow

```
1. User logs in → AuthController returns UserResource with roles: ['admin']
2. Frontend: AuthService stores user signal
3. Navbar: *ngIf="isAdmin" (getter → auth.hasRole('admin') → user.roles.includes('admin'))
4. Route guard: adminGuard → auth.hasRole('admin') → allows /admin/* routes
5. Backend: abort_unless($request->user()->isAdmin(), 403) on admin endpoints
```
