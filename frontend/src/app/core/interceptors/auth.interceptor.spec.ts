import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, withXsrfConfiguration, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  const mockTokenExtractor: Partial<HttpXsrfTokenExtractor> = {
    getToken: () => 'mock-csrf-token',
  };

  function setup(tokenExtractor: Partial<HttpXsrfTokenExtractor> = mockTokenExtractor) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor]), withXsrfConfiguration({
          cookieName: 'XSRF-TOKEN',
          headerName: 'X-XSRF-TOKEN',
        })),
        provideHttpClientTesting(),
        { provide: HttpXsrfTokenExtractor, useValue: tokenExtractor },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  }

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should add withCredentials and X-XSRF-TOKEN header to API requests', () => {
    setup();
    http.get('/api/posts').subscribe();

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('X-XSRF-TOKEN')).toBe(true);
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-csrf-token');
    req.flush([]);
  });

  it('should add withCredentials to requests containing /api/ in URL', () => {
    setup();
    http.get('http://localhost:8080/api/posts').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/posts');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('should not modify non-API requests', () => {
    setup();
    http.get('/sanctum/csrf-cookie').subscribe();

    const req = httpMock.expectOne('/sanctum/csrf-cookie');
    expect(req.request.withCredentials).toBe(false);
    expect(req.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    req.flush({});
  });

  it('should not add X-XSRF-TOKEN header when token is null', () => {
    setup({ getToken: () => null });
    http.get('/api/posts').subscribe();

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    req.flush([]);
  });

  it('should not add X-XSRF-TOKEN header when token is empty string', () => {
    setup({ getToken: () => '' });
    http.get('/api/posts').subscribe();

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    req.flush([]);
  });

  it('should apply to POST requests with /api prefix', () => {
    setup();
    http.post('/api/auth/login', { email: 'test@example.com', password: 'pass' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-csrf-token');
    req.flush({});
  });
});
