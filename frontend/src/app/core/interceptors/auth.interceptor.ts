import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiOrSanctum = req.url.startsWith('/api') || req.url.includes('/api/') || req.url.startsWith('/sanctum') || req.url.includes('/sanctum/');

  if (isApiOrSanctum) {
    const router = inject(Router);
    const auth = inject(AuthService);

    return next(req.clone({
      withCredentials: true,
    })).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
          auth.logout();
          router.navigate(['/login'], { queryParams: { session: 'expired' } });
        }
        return throwError(() => err);
      }),
    );
  }

  return next(req);
};
