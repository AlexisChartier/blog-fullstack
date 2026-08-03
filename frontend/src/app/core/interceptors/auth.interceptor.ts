import { HttpInterceptorFn, HttpXsrfTokenExtractor } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest = req.url.startsWith('/api') || req.url.includes('/api/');

  if (isApiRequest) {
    const tokenExtractor = inject(HttpXsrfTokenExtractor);
    const csrfToken = tokenExtractor.getToken();
    const headers: Record<string, string> = {};

    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }

    return next(req.clone({
      withCredentials: true,
      setHeaders: headers,
    }));
  }

  return next(req);
};
