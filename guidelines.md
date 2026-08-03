# Development Guidelines

Project: **DevBlog** — Angular 17 (SSR) + Laravel 13, PHP 8.3, PostgreSQL, Redis, Docker.

---

## 1. Ship a Feature — Workflow

Every feature follows this strict protocol. No exceptions.

```
1. Write tests first        — Pest PHP (backend) / Karma+Jasmine (frontend)
2. Implement the feature    — Make the tests pass
3. Run quality gates         — tests, lint, phpstan must all pass
4. Commit & push            — Conventional commit message
```

### 1.1 Step-by-step

| Step | Command (backend) | Command (frontend) |
|------|-------------------|--------------------|
| Write test | `tests/Feature` or `tests/Unit` | `src/**/*.spec.ts` |
| Implement | `app/` | `src/` |
| Run tests | `php artisan test` | `npm run test` |
| Run lint | `./vendor/bin/pint --test` | `npm run lint` |
| Run phpstan | `./vendor/bin/phpstan analyse --no-progress --memory-limit=512M` | — |
| Fix lint | `./vendor/bin/pint` | `npm run lint -- --fix` |
| Commit | `git commit -m "feat(scope): description"` | same |
| Push | `git push` | same |

### 1.2 Rules

- **Red → Green → Refactor.** The test must fail before the implementation exists, pass after.
- **One feature per commit.** If you need two commits, the feature is too broad — split it.
- **Never commit if any gate fails.** Tests, Pint, PHPStan must all be green.
- **Minimum 80% coverage** enforced in CI (`--min=80`).
- **PHPStan level 4** must pass with zero errors.

---

## 2. Laravel Best Practices (Cruddy by Design)

Reference: [Cruddy by Design](https://cruddybydesign.com) / skill `laravel-cruddy-by-design`

### 2.1 Controllers: thin and RESTful

Controllers handle **HTTP concerns only**: request validation, model interaction, HTTP response. Business logic belongs in models, services, or actions.

```php
// BAD — mixed HTTP and business logic
public function store(Request $request)
{
    $validated = $request->validate([...]);
    $user = User::create($validated);
    $user->assignRole('author');
    Mail::to($user)->send(new WelcomeEmail());
    return redirect()->route('home');
}

// GOOD — HTTP concerns only, delegate logic elsewhere
public function store(RegisterUserRequest $request)
{
    $user = User::create($request->validated());
    return redirect()->route('home')->with('success', 'User created');
}
```

### 2.2 Standard CRUD methods only

Every controller contains **only** the 7 RESTful methods or `__invoke`:

| Method | Action |
|--------|--------|
| `index` | List resources |
| `show` | Show one resource |
| `create` | Show create form |
| `store` | Create resource |
| `edit` | Show edit form |
| `update` | Update resource |
| `destroy` | Delete resource |

**Never** add custom verb methods (`publish()`, `subscribe()`, `updateCoverImage()`).

### 2.3 Refactoring custom actions

When a requirement seems to need a custom verb, extract it into a dedicated resource or invokable controller:

| Instead of (fat controller) | Use (cruddy) |
|------------------------------|--------------|
| `PostController@publish` | `PublishPostController@__invoke` (invokable) |
| `PostController@listComments` | `PostCommentController@index` (nested resource) |
| `PostController@updateCover` | `PostCoverImageController@update` (dedicated resource) |
| `PostController@subscribe` | `SubscriptionController@store` (treat pivot as resource) |

### 2.4 Routes

Use `Route::resource()`, `Route::apiResource()`, or explicit standard mapping:

```php
// GOOD — resource routes
Route::apiResource('posts', PostController::class);

// GOOD — invokable controller for a single action
Route::post('/posts/{post}/publish', PublishPostController::class);

// GOOD — nested resource
Route::get('/posts/{post}/comments', [PostCommentController::class, 'index']);
```

### 2.5 Validation

Use **Form Requests** — never validate inline in the controller:

```php
// GOOD
public function store(StorePostRequest $request)
{
    $post = Post::create($request->validated());
    return new PostResource($post);
}
```

### 2.6 API Resources

Always transform models through API Resources for consistent JSON output:

```php
public function index(): AnonymousResourceCollection
{
    return PostResource::collection(Post::with(['author', 'category', 'tags'])->paginate(15));
}
```

### 2.7 Eloquent

- Use **mass assignment** (`$fillable` / `$guarded`).
- Use **scopes** for reusable query conditions.
- Use **accessors & mutators** for derived attributes.
- **Eager load** relationships to avoid N+1 (`->with()`, `::with()`).
- Put business logic on the **model**, not the controller.

### 2.8 Policies

Authorize actions through **Policies**, not inline `if` checks in controllers:

```php
// GOOD — policy handles authorization
public function update(UpdatePostRequest $request, Post $post)
{
    $this->authorize('update', $post);
    $post->update($request->validated());
    return new PostResource($post);
}
```

---

## 3. Design Patterns — When to Use What

Reference: [Refactoring Guru](https://refactoring.guru/design-patterns)

### 3.1 Creational Patterns — object creation

> **Naming confusion warning — Laravel Factories vs Factory Method pattern**
>
> These are two completely different concepts that share a name:
>
> | | Laravel Factories | Factory Method (design pattern) |
> |---|---|---|
> | **What** | Test data generators (`User::factory()->create()`) | A creational pattern where a class defers instantiation to subclasses |
> | **Purpose** | Seed the database with realistic test data | Decouple a class from the concrete objects it creates |
> | **Where** | `database/factories/`, used in Pest tests and seeders | Application code where the exact object type is determined at runtime |
> | **Example** | `Post::factory()->published()->create()` | `PaymentGatewayFactory::make($type)->pay($amount)` |
>
> When this document says "Factory Method" or "Abstract Factory" in the design pattern
> section, it refers to the GoF pattern — **not** Laravel's `Factory` classes in `database/factories/`.

| Pattern | Use when | Laravel example |
|---------|----------|-----------------|
| **Factory Method** | A class can't anticipate the type of objects it must create | `PaymentGatewayFactory::make($type)->charge($amount)` — **not** Eloquent factories (see note above) |
| **Abstract Factory** | You need to create families of related objects without specifying concrete classes | Multi-tenant DB connections, payment gateway adapters |
| **Builder** | You need step-by-step construction of a complex object | Query builders: `DB::table()->where()->orderBy()`, mail builders: `Mail::to()->subject()->attach()` |
| **Prototype** | You need to clone objects without depending on their concrete class | Eloquent `replicate()`: `$post->replicate()->save()` |
| **Singleton** | You need exactly one instance of a class shared across the app | Laravel's Container (Application), Facades, config repository — **use sparingly**, prefer DI |

### 3.2 Structural Patterns — composition

| Pattern | Use when | Laravel example |
|---------|----------|-----------------|
| **Adapter** | You need to make two incompatible interfaces work together | PSR interfaces (cache, log), 3rd-party API wrappers |
| **Bridge** | You need to split a large class into two separate hierarchies | Eloquent drivers (MySQL, PostgreSQL, SQLite) sharing the same ORM API |
| **Composite** | You need a tree structure where individual objects and compositions share the same interface | Laravel Collections, nested category trees |
| **Decorator** | You need to add behavior without modifying the original class | Middleware pipeline, `Cache::remember()`, `DB::transaction()` wrapping |
| **Facade** | You need a simple interface to a complex subsystem | Laravel Facades: `Auth::`, `Cache::`, `DB::`, `Mail::`, `Route::` |
| **Flyweight** | You need to share state to support many fine-grained objects | Container singletons, connection pools |
| **Proxy** | You need a placeholder controlling access to another object | Lazy-loaded Eloquent relationships, API resources |

### 3.3 Behavioral Patterns — interaction & responsibility

| Pattern | Use when | Laravel example |
|---------|----------|-----------------|
| **Chain of Responsibility** | You need a series of handlers, each deciding whether to pass along the request | **Middleware pipeline** — `auth:sanctum`, `verified`, `throttle` |
| **Command** | You need to encapsulate a request as an object | Queued jobs (`ShouldQueue`), artisan commands, `Action` classes |
| **Iterator** | You need to traverse a collection without exposing its internal structure | Laravel Collections (`each`, `map`, `filter`, `lazy()`) |
| **Mediator** | You need to decouple components that communicate directly | Laravel Event Dispatcher: `event(new PostPublished($post))` |
| **Memento** | You need to capture and restore an object's state | Model `savepoint()` / `DB::transaction()` rollback, soft deletes |
| **Observer** | You need to react to state changes in another object | Eloquent observers: `creating`, `updated`, `deleting` hooks |
| **State** | An object's behavior depends on its state and must change at runtime | Post status transitions: `draft → published → archived` as State classes |
| **Strategy** | You need interchangeable algorithms behind a common interface | Payment strategies, different validation rules per context |
| **Template Method** | You need a skeleton algorithm with overridable steps | Form Requests `authorize()` + `rules()`, base controller setup |
| **Visitor** | You need to add operations to objects without modifying their classes | Complex report generators iterating over disparate model types |

### 3.4 Practical guidance for this project

- **Default to Action classes** (Command pattern) for complex business logic: `app/Actions/PublishPost.php`.
- **Use Observers** for model lifecycle side effects (e.g., sending email after `Post::created`).
- **Use Middleware** (Chain of Responsibility) for cross-cutting concerns: auth, throttling, CORS.
- **Use Policies** (Strategy) for authorization logic.
- **Use Events/Listeners** (Mediator) to decouple side effects from the action that triggered them.
- **Use Collections** (Iterator + Composite) for data transformation instead of raw loops.
- **Avoid Singleton abuse** — prefer dependency injection through the service container.

---

## 4. Code Smells to Watch For

Reference: [Refactoring Guru — Code Smells](https://refactoring.guru/refactoring/smells)

| Category | Smell | Fix |
|----------|-------|-----|
| **Bloaters** | Long Method | Extract Method — break into named sub-methods |
| | Large Class | Extract Class — split responsibilities |
| | Long Parameter List | Introduce Parameter Object (Form Request, DTO) |
| **OO Abusers** | Switch Statements | Replace Conditional with Polymorphism (Strategy / State) |
| | Temporary Field | Move field to the object that owns it |
| **Change Preventers** | Divergent Change | Split Class — one reason to change each |
| | Shotgun Surgery | Move fields/methods together — bundle coupled changes |
| **Dispensables** | Duplicate Code | Extract Method / Extract Class |
| | Dead Code | Delete it. No mercy. |
| | Comments | Replace with expressive code — comments explain *why*, not *what* |
| **Couplers** | Feature Envy | Move Method to the object it's obsessed with |
| | Inappropriate Intimacy | Hide Delegate — talk to the direct owner |
| | Middle Man | Remove Middle Man — call the real object |

### 4.1 Laravel-specific red flags

- Controller with more than 7 methods → **split into dedicated controllers**.
- Controller doing business logic → **extract to model, action, or service**.
- Raw SQL when Eloquent can do it → **use Eloquent or query builder**.
- N+1 queries → **eager load with `with()`**.
- Validation in controller → **move to Form Request**.
- Authorization in controller body → **move to Policy**.
- Hard-coded strings/numbers → **constants, enums, or config**.
- `if/elseif` chains on type → **Strategy or State pattern**.

---

## 5. Angular Best Practices (Frontend)

Reference: [Angular Style Guide](https://angular.dev/style-guide) | [Angular Testing](https://angular.dev/guide/testing)

This project uses **Angular 17** with standalone components, signals, SSR, and Tailwind CSS.

### 5.1 Project structure

```
src/app/
├── core/           # Singletons: services, guards, interceptors, models, tokens, resolvers
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   ├── resolvers/
│   ├── services/
│   └── tokens/
├── features/        # Feature-area components (one folder per route view)
│   ├── admin/
│   ├── auth/
│   ├── blog/
│   └── profile/
└── shared/         # Reusable UI components, pipes, directives
    └── components/
```

- **Organize by feature area**, not by code type (no `components/`, `services/` at root).
- **One concept per file** — one component, service, or guard per file.
- **Hyphen-separated file names**: `post-list.component.ts`, `auth.service.ts`.
- **Test files next to the code**: `post-list.component.spec.ts` lives alongside `post-list.component.ts`.

### 5.2 Components

**Standalone components only** — no NgModules:

```ts
// GOOD
@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe],
  templateUrl: './post-list.component.html',
})
export class PostListComponent implements OnInit {
  private blogService = inject(BlogService);
  posts = signal<Post[]>([]);
  loading = signal(true);
}
```

- **`inject()` over constructor injection** — more readable, better type inference.
- **Group Angular-specific properties first** — inputs, outputs, injected deps, then methods.
- **`protected` access** for members only used in the template:
  ```ts
  protected fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
  ```
- **`readonly`** for `input()`, `output()`, `model()`, and query results.
- **Keep components focused on presentation** — extract business logic to services.
- **Name event handlers for what they do**, not the trigger: `(click)="savePost()"`, not `(click)="handleClick()"`.
- **Keep lifecycle methods simple** — delegate to well-named methods:
  ```ts
  ngOnInit() {
    this.loadPosts();
  }
  ```

### 5.3 Signals — state management

Signals are the primary state mechanism. RxJS Observables are used for HTTP streams and bridged into signals.

```ts
// Local state in components
posts = signal<Post[]>([]);
loading = signal(true);
currentPage = signal(1);

// Derived state — use computed(), NOT plain getters
readonly hasFilter = computed(() => !!this.currentFilter());
readonly pageNumbers = computed(() => {
  const pages = [];
  for (let i = 1; i <= this.totalPages(); i++) pages.push(i);
  return pages;
});
```

| Do | Don't |
|----|-------|
| `signal<T>(initialValue)` for mutable state | Don't use `any` as signal type |
| `computed(() => ...)` for derived values | Don't use plain getters for derived state (re-runs every CD cycle, no memoization) |
| `.set()`, `.update()` to mutate | Don't reassign signal references |
| `.asReadonly()` to expose immutably | Don't expose writable signals from services |
| `effect(() => ...)` for side effects | Don't put side effects in `computed()` |

**Shared auth state** — the `AuthService` exposes readonly signals:

```ts
// In AuthService
private readonly _user = signal<User | null>(null);
readonly user = this._user.asReadonly();
readonly loading = this._loading.asReadonly();

// In components
readonly loading = this.auth.loading;  // direct alias
```

### 5.4 Routing

**Lazy-load every route** with `loadComponent`:

```ts
export const routes: Routes = [
  {
    path: '',
    resolve: { posts: postsResolver },
    loadComponent: () => import('./features/blog/post-list/post-list.component').then(m => m.PostListComponent),
  },
  {
    path: 'settings/profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile-edit/profile-edit.component').then(m => m.ProfileEditComponent),
  },
];
```

- **Functional guards** (`CanActivateFn`) over class-based guards.
- **Functional interceptors** (`HttpInterceptorFn`) over class-based.
- **Resolvers** pre-fetch data so components hydrate from `route.data`:
  ```ts
  ngOnInit() {
    this.route.data.subscribe(({ posts }) => {
      this.posts.set(posts.data);
      this.loading.set(false);
    });
  }
  ```

### 5.5 HTTP & services

**Return Observables from service methods** — never fire-and-forget `.subscribe()`:

```ts
// GOOD — returns Observable, component decides when to subscribe
getPosts(page = 1, filters?: PostFilters): Observable<Paginated<Post>> {
  let params = new HttpParams().set('page', page);
  if (filters?.search) params = params.set('search', filters.search);
  return this.http.get<Paginated<Post>>(`${this.apiUrl}/posts`, { params });
}

// BAD — fire-and-forget, untestable, component can't handle errors
login(email: string, password: string) {
  this.http.post(...).subscribe({ next: ... });  // No return, no error handling
}
```

- **Type all HTTP responses** with generics: `this.http.get<Post>(...)`.
- **Unwrap Laravel's `{ data }` envelope** in the service: `.pipe(map(res => res.data))`.
- **Error handling** — surface error messages to the user, don't silently swallow:
  ```ts
  this.blogService.getPosts().subscribe({
    next: (res) => { this.posts.set(res.data); this.loading.set(false); },
    error: (err) => {
      this.loading.set(false);
      this.error.set(err.error?.message ?? 'Failed to load posts');
    },
  });
  ```
- **`@Injectable({ providedIn: 'root' })`** for all services — no module registration.

### 5.6 Interceptors & authentication

**Functional interceptor** (Angular 17 style):

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (req.url.includes('/api') && token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
```

Registered with `provideHttpClient(withInterceptors([authInterceptor]), withFetch())`.
- **`withFetch()`** is required for SSR compatibility.
- Only attach `Authorization` header to API requests.

### 5.7 SSR (Server-Side Rendering)

Guard all browser-only API access:

```ts
if (typeof localStorage !== 'undefined') { ... }
if (typeof document !== 'undefined') { ... }
if (typeof navigator !== 'undefined') { ... }
```

- **API URL injection token** — returns internal Docker URL on server, relative `/api` in browser.
- **`provideClientHydration()`** enabled for client-side hydration.
- **No `window` direct access** — use `document` or injection tokens.

### 5.8 Styling — Tailwind CSS

- **Dark mode** via `class` strategy — toggled on `<html>` by an `effect()` in `AppComponent`.
- **Reusable UI as `@layer components`** in `styles.css`, not as Angular components:
  ```css
  @layer components {
    .btn-primary { @apply inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white; }
    .input { @apply w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2; }
    .card { @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border; }
    .skeleton { @apply bg-gray-200 dark:bg-gray-800 rounded animate-pulse; }
  }
  ```
- **Always include dark-mode variants** in templates: `dark:bg-gray-900`.
- **Signal two-way binding** pattern:
  ```html
  <input [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
  ```

### 5.9 TypeScript

- **Strict mode is ON** — `strict: true`, `strictTemplates: true`, `noImplicitReturns`, `noFallthroughCasesInSwitch`.
- **Type all interfaces** in `core/models/` — mirror Laravel's API shapes (snake_case fields, `{ data }` envelopes, pagination).
- **Use union literal types** for enums: `status: 'draft' | 'published'`.
- **Generic `Paginated<T>`** for Laravel pagination responses.

### 5.10 Angular-specific code smells

| Smell | Fix |
|-------|-----|
| Plain getter for derived state | Replace with `computed()` — memoized, only re-runs when dependencies change |
| `subscribe()` inside a service (fire-and-forget) | Return the Observable; let the component subscribe |
| Silent error swallowing (`error: () => loading.set(false)`) | Surface `err.error?.message` to the user |
| `*ngIf` / `*ngFor` (legacy structural directives) | Migrate to `@if` / `@for` control-flow blocks (Angular 17+) |
| Direct `window` access | Use `document` or injection token for SSR safety |
| `public` for template-only members | Use `protected` to keep the class API clean |
| Complex template expressions | Move to a `computed()` signal |
| Constructor injection | Use `inject()` function |

---

## 6. Testing Standards

### 6.1 Backend — Pest PHP

- **Feature tests** (`tests/Feature/`) — HTTP endpoints, database, full request lifecycle.
- **Unit tests** (`tests/Unit/`) — isolated model methods, policy logic, pure functions.
- **Test names** describe behavior: `it('creates a post with valid data')`, `it('rejects duplicate slugs')`.
- **Arrange-Act-Assert** structure in every test.
- Use **factories** and **seeders** for test data — never hard-code fixtures.
- SQLite in-memory for speed (`DB_DATABASE: :memory:`); PostgreSQL for CI parity.

### 6.2 Frontend — Karma + Jasmine

Reference: [Angular Testing Guide](https://angular.dev/guide/testing)

The project uses **Karma + Jasmine + ChromeHeadless** with `TestBed`. Tests must live next to the code as `*.spec.ts`.

#### Setup & teardown

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PostListComponent } from './post-list.component';
import { BlogService } from '@core/services/blog.service';

describe('PostListComponent', () => {
  let component: PostListComponent;
  let fixture: ComponentFixture<PostListComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PostListComponent],  // standalone component
      providers: [
        BlogService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });
});
```

#### Testing components — the basics

| What to test | How |
|--------------|-----|
| Component creates | `expect(component).toBeDefined()` |
| Template renders data | `fixture.nativeElement.textContent.toContain(...)` |
| Signal state changes | `component.loading.set(true); fixture.detectChanges();` |
| User interaction | `fixture.nativeElement.querySelector('button').click();` |
| Input changes | `component.searchQuery.set('test'); fixture.detectChanges();` |
| Child component rendering | `fixture.debugElement.query(By.css('app-post-card'))` |

```ts
it('renders posts from signal', () => {
  component.posts.set([
    { id: 1, title: 'Hello', slug: 'hello', excerpt: null, content: '', status: 'published', published_at: null, created_at: '', updated_at: '' },
  ]);
  fixture.detectChanges();  // trigger CD to update the DOM
  const el: HTMLElement = fixture.nativeElement;
  expect(el.textContent).toContain('Hello');
});

it('shows loading skeleton while loading', () => {
  component.loading.set(true);
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.skeleton')).toBeTruthy();
});
```

#### Testing services with HTTP mocking

Use `HttpTestingController` — never make real network requests:

```ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BlogService } from './blog.service';

describe('BlogService', () => {
  let service: BlogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BlogService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BlogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();  // assert no outstanding requests
  });

  it('fetches posts with pagination', () => {
    const mockResponse = { data: [{ id: 1, title: 'Post 1' }], current_page: 1, last_page: 1, total: 1, per_page: 15, from: 1, to: 1, prev_page_url: null, next_page_url: null };

    service.getPosts(1).subscribe(res => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].title).toBe('Post 1');
    });

    const req = httpMock.expectOne('/api/posts?page=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);  // simulate server response
  });

  it('sends auth header for protected endpoints', () => {
    service.createPost({ title: 'New', content: '...', status: 'draft' }).subscribe();

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    req.flush({ data: { id: 1 } });
  });
});
```

#### Testing guards

```ts
import { TestBed } from '@angular/core/testing';
import { authGuard } from './auth.guard';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

describe('authGuard', () => {
  it('allows navigation when authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
        { provide: Router, useValue: { parseUrl: () => {} } },
      ],
    });
    expect(TestBed.runInInjectionContext(() => authGuard())).toBeTrue();
  });

  it('redirects to /login when unauthenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => false } },
        { provide: Router, useValue: { parseUrl: (url: string) => url } },
      ],
    });
    const result = TestBed.runInInjectionContext(() => authGuard());
    expect(result).toBe('/login');
  });
});
```

#### Testing rules

| Rule | Detail |
|------|--------|
| File placement | `*.spec.ts` next to the file under test |
| Naming | `describe('ClassName')` + `it('should <expected behavior>')` |
| Structure | **Arrange** (setup) → **Act** (call) → **Assert** (verify) |
| Isolation | Each test independent — use `beforeEach` / `afterEach` |
| HTTP | Always mock with `HttpTestingController` — never hit real endpoints |
| Cleanup | Call `httpMock.verify()` in `afterEach` |
| Change detection | Call `fixture.detectChanges()` after signal/property changes |
| Async | Use `async/await` + `fixture.whenStable()`, or `fakeAsync` + `tick()` |
| Signals | Read with `signal()` call syntax in assertions, set with `.set()` / `.update()` |
| Templates | Query DOM with `nativeElement.querySelector` or `debugElement.query(By.css(...))` |
| Coverage | Target > 80% (enforced in CI for backend, expected for frontend) |

---

## 7. Code Quality Gates

All must pass before commit. No exceptions.

| Gate | Backend | Frontend |
|------|---------|----------|
| Tests | `php artisan test` | `npm run test` |
| Coverage | `--min=80` (CI enforced) | — |
| Static analysis | `./vendor/bin/phpstan analyse --no-progress --memory-limit=512M` (level 4) | — |
| Code style | `./vendor/bin/pint --test` | `npm run lint` |
| Auto-fix | `./vendor/bin/pint` | `npm run lint -- --fix` |
| Build | — | `npm run build` |

### CI pipeline (`.github/workflows/ci.yml`)

1. Backend: tests + coverage → PHPStan → Pint → upload coverage
2. Frontend: lint → build SSR
3. SonarCloud analysis (after both pass)

---

## 8. Git Conventions

### Commit message format

Follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <description>

[optional body]
```

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. (Pint auto-fix) |
| `chore` | Build, tooling, dependencies |

Example: `feat(posts): add publish endpoint with authorization`

### Branching

- `main` — production-ready
- `develop` — integration
- `feat/<short-name>` — feature branch
- `fix/<short-name>` — bug fix branch

---

## 9. Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  SHIP PROTOCOL                                          │
│  1. Write failing test                                  │
│  2. Implement to make it pass                           │
│  3. php artisan test && vendor/bin/pint &&              │
│     vendor/bin/phpstan analyse                          │
│  4. git commit -m "feat(scope): desc" && git push      │
├─────────────────────────────────────────────────────────┤
│  LARAVEL — CRUDDY BY DESIGN                             │
│  • Max 7 methods per controller (or __invoke)           │
│  • Route::apiResource() for standard CRUD              │
│  • Form Requests for validation                         │
│  • Policies for authorization                           │
│  • API Resources for response shaping                   │
│  • Business logic in models, actions, or services      │
├─────────────────────────────────────────────────────────┤
│  DESIGN PATTERNS — PICK BY INTENT                       │
│  Creating objects  → Factory, Builder, Prototype       │
│  Composing objects → Decorator, Facade, Adapter         │
│  Behavior          → Strategy, State, Observer, Command │
│  Avoid → Singleton abuse, God classes, switch chains   │
├─────────────────────────────────────────────────────────┤
│  ANGULAR — STANDALONE + SIGNALS                         │
│  • Standalone components, inject(), templateUrl         │
│  • signal() for state, computed() for derived values   │
│  • Services return Observables, never fire-and-forget   │
│  • Lazy loadComponent routes + functional guards        │
│  • HttpTestingController to mock all HTTP in tests      │
│  • *.spec.ts next to the code under test                 │
│  • Protected access for template-only members            │
│  • Guard localStorage/document for SSR                   │
└─────────────────────────────────────────────────────────┘
```
