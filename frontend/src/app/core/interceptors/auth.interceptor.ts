import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api') || req.url.includes('/api/')) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
