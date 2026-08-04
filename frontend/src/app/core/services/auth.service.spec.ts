import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '../models';
import { API_URL } from '../tokens/api-url.token';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 1,
    name: 'Jane Doe',
    username: 'jane_doe',
    email: 'jane@example.com',
    avatar_url: null,
    bio: 'Developer',
    roles: ['author'],
    created_at: '2026-01-01T00:00:00Z',
  };

  const mockAdmin: User = {
    ...mockUser,
    id: 2,
    roles: ['admin'],
  };

  const mockReader: User = {
    ...mockUser,
    id: 3,
    roles: ['reader'],
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: API_URL, useValue: '/api' },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Flush the initial /auth/me request fired by the constructor's restoreSession()
    const initialReq = httpMock.expectOne('/api/auth/me');
    initialReq.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with null user', () => {
      expect(service.user()).toBeNull();
    });

    it('should start unauthenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should start with loading false', () => {
      expect(service.loading()).toBe(false);
    });
  });

  describe('restoreSession (constructor)', () => {
    it('should call fetchUser on construction in browser (flushed in beforeEach)', () => {
      // The initial /auth/me request was already flushed in beforeEach.
      // If AuthService didn't call fetchUser, no request would have been made.
      // Test passes if beforeEach didn't throw — meaning the request existed.
      expect(service).toBeTruthy();
    });
  });

  describe('login', () => {
    it('should set loading true immediately', () => {
      service.login('jane@example.com', 'Password123!');
      expect(service.loading()).toBe(true);
      // Clean up pending requests fired by login (CSRF + login POST)
      httpMock.expectOne('/sanctum/csrf-cookie').flush({});
      httpMock.expectOne('/api/auth/login').flush({});
    });

    it('should fetch CSRF cookie before login', fakeAsync(() => {
      service.login('jane@example.com', 'Password123!');

      const csrfReq = httpMock.expectOne('/sanctum/csrf-cookie');
      expect(csrfReq.request.method).toBe('GET');
      csrfReq.flush({});

      tick();

      const loginReq = httpMock.expectOne('/api/auth/login');
      expect(loginReq.request.method).toBe('POST');
      expect(loginReq.request.body).toEqual({
        email: 'jane@example.com',
        password: 'Password123!',
      });
      loginReq.flush({ message: 'Login successful', user: mockUser });

      tick();

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.loading()).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should set loading false on login error', fakeAsync(() => {
      service.login('jane@example.com', 'wrong');

      const csrfReq = httpMock.expectOne('/sanctum/csrf-cookie');
      csrfReq.flush({});

      tick();

      const loginReq = httpMock.expectOne('/api/auth/login');
      loginReq.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(service.loading()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.user()).toBeNull();
    }));

    it('should set loading false if CSRF cookie fetch fails', fakeAsync(() => {
      service.login('jane@example.com', 'Password123!');

      const csrfReq = httpMock.expectOne('/sanctum/csrf-cookie');
      csrfReq.flush({}, { status: 500, statusText: 'Server Error' });

      tick();

      expect(service.loading()).toBe(false);
      httpMock.expectNone('/api/auth/login');
    }));
  });

  describe('register', () => {
    it('should set loading true immediately', () => {
      service.register('Jane', 'jane_doe', 'jane@example.com', 'Password123!');
      expect(service.loading()).toBe(true);
      // Clean up pending requests fired by register (CSRF + register POST)
      httpMock.expectOne('/sanctum/csrf-cookie').flush({});
      httpMock.expectOne('/api/auth/register').flush({});
    });

    it('should fetch CSRF cookie then register with password_confirmation', fakeAsync(() => {
      service.register('Jane Doe', 'jane_doe', 'jane@example.com', 'Password123!');

      const csrfReq = httpMock.expectOne('/sanctum/csrf-cookie');
      csrfReq.flush({});

      tick();

      const regReq = httpMock.expectOne('/api/auth/register');
      expect(regReq.request.method).toBe('POST');
      expect(regReq.request.body).toEqual({
        name: 'Jane Doe',
        username: 'jane_doe',
        email: 'jane@example.com',
        password: 'Password123!',
        password_confirmation: 'Password123!',
      });
      regReq.flush({ message: 'Registration successful', user: mockUser }, { status: 201, statusText: 'Created' });

      tick();

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.loading()).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should set loading false on register error', fakeAsync(() => {
      service.register('Jane', 'jane_doe', 'taken@example.com', 'Password123!');

      const csrfReq = httpMock.expectOne('/sanctum/csrf-cookie');
      csrfReq.flush({});

      tick();

      const regReq = httpMock.expectOne('/api/auth/register');
      regReq.flush({ message: 'Email already taken' }, { status: 422, statusText: 'Unprocessable' });

      tick();

      expect(service.loading()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    }));

    it('should set loading false if CSRF cookie fetch fails during register', fakeAsync(() => {
      service.register('Jane', 'jane_doe', 'jane@example.com', 'Password123!');

      const csrfReq = httpMock.expectOne('/sanctum/csrf-cookie');
      csrfReq.flush({}, { status: 500, statusText: 'Server Error' });

      tick();

      expect(service.loading()).toBe(false);
      httpMock.expectNone('/api/auth/register');
    }));
  });

  describe('logout', () => {
    it('should POST to /auth/logout', fakeAsync(() => {
      service.logout();

      const req = httpMock.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Logged out' });

      tick();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    }));
  });

  describe('fetchUser', () => {
    it('should set user and authenticated on success', fakeAsync(() => {
      service.fetchUser();

      const req = httpMock.expectOne('/api/auth/me');
      req.flush({ user: mockUser });

      tick();

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    }));

    it('should set unauthenticated on error', fakeAsync(() => {
      service.fetchUser();

      const req = httpMock.expectOne('/api/auth/me');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(service.isAuthenticated()).toBe(false);
    }));
  });

  describe('hasRole', () => {
    it('should return false when user is null', () => {
      expect(service.hasRole('admin')).toBe(false);
    });

    it('should return false when user has no roles array', () => {
      service['_user'].set({ ...mockUser, roles: undefined });
      expect(service.hasRole('admin')).toBe(false);
    });

    it('should return true when user has the exact role', () => {
      service['_user'].set(mockAdmin);
      expect(service.hasRole('admin')).toBe(true);
    });

    it('should return true for "author" when user is admin', () => {
      service['_user'].set(mockAdmin);
      expect(service.hasRole('author')).toBe(true);
    });

    it('should return true for "author" when user is author', () => {
      service['_user'].set(mockUser);
      expect(service.hasRole('author')).toBe(true);
    });

    it('should return false for "author" when user is reader', () => {
      service['_user'].set(mockReader);
      expect(service.hasRole('author')).toBe(false);
    });

    it('should return false when user does not have the role', () => {
      service['_user'].set(mockReader);
      expect(service.hasRole('admin')).toBe(false);
    });
  });
});
