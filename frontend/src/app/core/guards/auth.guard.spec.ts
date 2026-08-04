import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, authorGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal, WritableSignal } from '@angular/core';
import { firstValueFrom, isObservable } from 'rxjs';

function createMockSnapshot(): ActivatedRouteSnapshot {
  return {} as ActivatedRouteSnapshot;
}

function createMockState(): RouterStateSnapshot {
  return { url: '/' } as RouterStateSnapshot;
}

function setupAuth(opts: {
  isAuthenticated: boolean;
  hasRole?: boolean;
  sessionChecked: boolean;
}): { sessionCheckedSignal: WritableSignal<boolean>; setAuth: (v: boolean) => void; setRole: (v: boolean) => void; routerSpy: jasmine.SpyObj<Router> } {
  const sessionCheckedSignal = signal(opts.sessionChecked);
  let authenticated = opts.isAuthenticated;
  let role = opts.hasRole ?? false;

  const auth = {
    isAuthenticated: () => authenticated,
    hasRole: (_r: string) => role,
    sessionChecked: sessionCheckedSignal.asReadonly(),
  };

  const routerSpy = jasmine.createSpyObj('Router', ['parseUrl', 'navigate']);
  routerSpy.parseUrl.and.callFake((url: string) => ({ url } as unknown as UrlTree));
  routerSpy.navigate.and.returnValue(Promise.resolve(true));

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: Router, useValue: routerSpy },
    ],
  });

  return {
    sessionCheckedSignal,
    setAuth: (v: boolean) => { authenticated = v; },
    setRole: (v: boolean) => { role = v; },
    routerSpy,
  };
}

describe('authGuard', () => {
  it('should allow navigation when authenticated', () => {
    const { routerSpy } = setupAuth({ isAuthenticated: true, sessionChecked: true });
    const result = TestBed.runInInjectionContext(() => authGuard(createMockSnapshot(), createMockState()));
    expect(result).toBe(true);
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('should redirect to /login when unauthenticated and session checked', () => {
    const { routerSpy } = setupAuth({ isAuthenticated: false, sessionChecked: true });
    const result = TestBed.runInInjectionContext(() => authGuard(createMockSnapshot(), createMockState()));
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
    expect((result as unknown as { url: string }).url).toBe('/login');
  });

  it('should wait for session check then allow when authenticated', async () => {
    const { sessionCheckedSignal, setAuth, routerSpy } = setupAuth({ isAuthenticated: false, sessionChecked: false });
    const result = TestBed.runInInjectionContext(() => authGuard(createMockSnapshot(), createMockState()));
    expect(isObservable(result)).toBe(true);

    setAuth(true);
    sessionCheckedSignal.set(true);

    const allowed = await firstValueFrom(result as any);
    expect(allowed).toBe(true);
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('should wait for session check then redirect when unauthenticated', async () => {
    const { sessionCheckedSignal, routerSpy } = setupAuth({ isAuthenticated: false, sessionChecked: false });
    const result = TestBed.runInInjectionContext(() => authGuard(createMockSnapshot(), createMockState()));
    expect(isObservable(result)).toBe(true);

    sessionCheckedSignal.set(true);

    const allowed = await firstValueFrom(result as any);
    expect(allowed).not.toBe(true);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
  });
});

describe('authorGuard', () => {
  it('should allow navigation when authenticated and has author role', () => {
    const { routerSpy } = setupAuth({ isAuthenticated: true, hasRole: true, sessionChecked: true });
    const result = TestBed.runInInjectionContext(() => authorGuard(createMockSnapshot(), createMockState()));
    expect(result).toBe(true);
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('should redirect to / when authenticated but not author', () => {
    const { routerSpy } = setupAuth({ isAuthenticated: true, hasRole: false, sessionChecked: true });
    const result = TestBed.runInInjectionContext(() => authorGuard(createMockSnapshot(), createMockState()));
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
    expect((result as unknown as { url: string }).url).toBe('/');
  });

  it('should redirect to / when unauthenticated and session checked', () => {
    const { routerSpy } = setupAuth({ isAuthenticated: false, hasRole: false, sessionChecked: true });
    const result = TestBed.runInInjectionContext(() => authorGuard(createMockSnapshot(), createMockState()));
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
    expect((result as unknown as { url: string }).url).toBe('/');
  });

  it('should wait for session check then allow when authenticated author', async () => {
    const { sessionCheckedSignal, setAuth, setRole, routerSpy } = setupAuth({ isAuthenticated: false, hasRole: false, sessionChecked: false });
    const result = TestBed.runInInjectionContext(() => authorGuard(createMockSnapshot(), createMockState()));
    expect(isObservable(result)).toBe(true);

    setAuth(true);
    setRole(true);
    sessionCheckedSignal.set(true);

    const allowed = await firstValueFrom(result as any);
    expect(allowed).toBe(true);
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('should wait for session check then redirect when not author', async () => {
    const { sessionCheckedSignal, setAuth, setRole, routerSpy } = setupAuth({ isAuthenticated: false, hasRole: false, sessionChecked: false });
    const result = TestBed.runInInjectionContext(() => authorGuard(createMockSnapshot(), createMockState()));
    expect(isObservable(result)).toBe(true);

    setAuth(true);
    setRole(false);
    sessionCheckedSignal.set(true);

    const allowed = await firstValueFrom(result as any);
    expect(allowed).not.toBe(true);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
  });
});
