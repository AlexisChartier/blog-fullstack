import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, withXsrfConfiguration, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([authInterceptor]),
          withXsrfConfiguration({
            cookieName: 'XSRF-TOKEN',
            headerName: 'X-XSRF-TOKEN',
          }),
        ),
        provideHttpClientTesting(),
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

  it('should add withCredentials to API GET requests', () => {
    setup();
    http.get('/api/posts').subscribe();

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('should add withCredentials to API POST requests', () => {
    setup();
    http.post('/api/auth/login', { email: 'test@example.com', password: 'pass' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should add withCredentials to requests containing /api/ in URL', () => {
    setup();
    http.get('http://localhost:8080/api/posts').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/posts');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('should add withCredentials to /sanctum/csrf-cookie requests', () => {
    setup();
    http.get('/sanctum/csrf-cookie').subscribe();

    const req = httpMock.expectOne('/sanctum/csrf-cookie');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should not modify non-API non-sanctum requests', () => {
    setup();
    http.get('/assets/data.json').subscribe();

    const req = httpMock.expectOne('/assets/data.json');
    expect(req.request.withCredentials).toBe(false);
    req.flush({});
  });
});
