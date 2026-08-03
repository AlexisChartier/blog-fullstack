import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, authorGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function createMockSnapshot(): ActivatedRouteSnapshot {
  return {} as ActivatedRouteSnapshot;
}

function createMockState(): RouterStateSnapshot {
  return { url: '/' } as RouterStateSnapshot;
}

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function setup(isAuthenticated: boolean) {
    authService = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    authService.isAuthenticated.and.returnValue(isAuthenticated);
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);
    routerSpy.parseUrl.and.callFake((url: string) => ({ url } as unknown as UrlTree));

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: routerSpy },
      ],
    });
  }

  it('should allow navigation when authenticated', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => authGuard(createMockSnapshot(), createMockState()));
    expect(result).toBe(true);
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('should redirect to /login when unauthenticated', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => authGuard(createMockSnapshot(), createMockState()));
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
    expect((result as unknown as { url: string }).url).toBe('/login');
  });
});

describe('authorGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function setup(isAuthenticated: boolean, hasRole: boolean) {
    authService = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'hasRole']);
    authService.isAuthenticated.and.returnValue(isAuthenticated);
    authService.hasRole.and.returnValue(hasRole);
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);
    routerSpy.parseUrl.and.callFake((url: string) => ({ url } as unknown as UrlTree));

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: routerSpy },
      ],
    });
  }

  it('should allow navigation when authenticated and has author role', () => {
    setup(true, true);
    const result = TestBed.runInInjectionContext(() => authorGuard(createMockSnapshot(), createMockState()));
    expect(result).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith('author');
  });

  it('should redirect to / when authenticated but not author', () => {
    setup(true, false);
    const result = TestBed.runInInjectionContext(() => authorGuard(createMockSnapshot(), createMockState()));
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
    expect((result as unknown as { url: string }).url).toBe('/');
  });

  it('should redirect to / when unauthenticated', () => {
    setup(false, false);
    const result = TestBed.runInInjectionContext(() => authorGuard(createMockSnapshot(), createMockState()));
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
    expect((result as unknown as { url: string }).url).toBe('/');
  });
});
