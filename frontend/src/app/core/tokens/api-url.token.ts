import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => {
    // Server-side: use internal Docker URL (nginx container)
    // Client-side: relative path works (browser sends to same origin)
    if (typeof process !== 'undefined' && process.env['SSR_API_URL']) {
      return process.env['SSR_API_URL'];
    }
    return '/api';
  },
});
