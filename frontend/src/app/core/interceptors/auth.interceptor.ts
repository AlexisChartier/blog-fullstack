import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isApiRequest = req.url.startsWith('/api') || req.url.includes('/api/');

  if (isApiRequest && token) {
    return next(req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }));
  }

  return next(req);
};
