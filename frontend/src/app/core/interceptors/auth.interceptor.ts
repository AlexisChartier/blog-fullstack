import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiOrSanctum = req.url.startsWith('/api') || req.url.includes('/api/') || req.url.startsWith('/sanctum') || req.url.includes('/sanctum/');

  if (isApiOrSanctum) {
    return next(req.clone({
      withCredentials: true,
    }));
  }

  return next(req);
};
