import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, Observable } from 'rxjs';
import { User } from '../models';
import { API_URL } from '../tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(API_URL);

  private _user = signal<User | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _sessionChecked = signal(false);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = signal(false);
  readonly sessionChecked = this._sessionChecked.asReadonly();

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    if (typeof window === 'undefined') {
      this._sessionChecked.set(true);
      return;
    }
    this.fetchUser();
  }

  private ensureCsrfCookie(): Observable<unknown> {
    if (typeof window === 'undefined') return of(null);
    return this.http.get('/sanctum/csrf-cookie');
  }

  login(email: string, password: string) {
    this._loading.set(true);
    this._error.set(null);
    this.ensureCsrfCookie().subscribe({
      next: () => {
        this.http.post<{ message: string; user: User }>(`${this.apiUrl}/auth/login`, { email, password })
          .subscribe({
            next: (res) => {
              this._user.set(res.user);
              this.isAuthenticated.set(true);
              this._loading.set(false);
              this.router.navigate(['/']);
            },
            error: (err: HttpErrorResponse) => {
              this._loading.set(false);
              this._error.set(this.parseError(err));
            },
          });
      },
      error: () => {
        this._loading.set(false);
        this._error.set('Could not connect to the server.');
      },
    });
  }

  register(name: string, username: string, email: string, password: string) {
    this._loading.set(true);
    this._error.set(null);
    this.ensureCsrfCookie().subscribe({
      next: () => {
        this.http.post<{ message: string; user: User }>(`${this.apiUrl}/auth/register`, {
          name, username, email, password, password_confirmation: password,
        }).subscribe({
          next: (res) => {
            this._user.set(res.user);
            this.isAuthenticated.set(true);
            this._loading.set(false);
            this.router.navigate(['/']);
          },
          error: (err: HttpErrorResponse) => {
            this._loading.set(false);
            this._error.set(this.parseError(err));
          },
        });
      },
      error: () => {
        this._loading.set(false);
        this._error.set('Could not connect to the server.');
      },
    });
  }

  logout() {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        this._user.set(null);
        this.isAuthenticated.set(false);
        this.router.navigate(['/']);
      },
    });
  }

  fetchUser() {
    this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        this._user.set(res.user);
        this.isAuthenticated.set(true);
        this._sessionChecked.set(true);
      },
      error: () => {
        this.isAuthenticated.set(false);
        this._sessionChecked.set(true);
      },
    });
  }

  hasRole(role: string): boolean {
    const user = this._user();
    if (!user?.roles) return false;
    if (role === 'author') return user.roles.includes('admin') || user.roles.includes('author');
    return user.roles.includes(role);
  }

  private parseError(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Could not connect to the server.';
    if (err.status === 401) return 'Invalid credentials.';
    if (err.status === 422 && err.error?.errors) {
      const messages = Object.values(err.error.errors) as string[];
      return messages[0] ?? 'Validation failed.';
    }
    return err.error?.message ?? 'An error occurred.';
  }
}
