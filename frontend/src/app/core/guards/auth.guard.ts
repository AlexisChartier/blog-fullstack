import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  if (!auth.sessionChecked()) {
    return toObservable(auth.sessionChecked).pipe(
      filter(checked => checked),
      take(1),
      map(() => {
        if (auth.isAuthenticated()) return true;
        return router.parseUrl('/login');
      }),
    );
  }

  return router.parseUrl('/login');
};

export const authorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.hasRole('author')) return true;

  if (!auth.sessionChecked()) {
    return toObservable(auth.sessionChecked).pipe(
      filter(checked => checked),
      take(1),
      map(() => {
        if (auth.isAuthenticated() && auth.hasRole('author')) return true;
        return router.parseUrl('/');
      }),
    );
  }

  return router.parseUrl('/');
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.hasRole('admin')) return true;

  if (!auth.sessionChecked()) {
    return toObservable(auth.sessionChecked).pipe(
      filter(checked => checked),
      take(1),
      map(() => {
        if (auth.isAuthenticated() && auth.hasRole('admin')) return true;
        return router.parseUrl('/');
      }),
    );
  }

  return router.parseUrl('/');
};
