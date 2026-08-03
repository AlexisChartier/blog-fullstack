import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models';
import { API_URL } from '../tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = inject(API_URL);

  private _user = signal<User | null>(null);
  private _loading = signal(false);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = signal(false);

  private TOKEN_KEY = 'blog_token';

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    if (typeof localStorage === 'undefined') return;
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.fetchUser();
    }
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string) {
    this._loading.set(true);
    this.http.post<{ message: string; user: User; token: string }>(`${this.apiUrl}/auth/login`, { email, password })
      .subscribe({
        next: (res) => {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.TOKEN_KEY, res.token);
          }
          this._user.set(res.user);
          this.isAuthenticated.set(true);
          this._loading.set(false);
          this.router.navigate(['/']);
        },
        error: () => this._loading.set(false),
      });
  }

  register(name: string, username: string, email: string, password: string) {
    this._loading.set(true);
    this.http.post<{ message: string; user: User; token: string }>(`${this.apiUrl}/auth/register`, {
      name, username, email, password, password_confirmation: password,
    }).subscribe({
      next: (res) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.TOKEN_KEY, res.token);
        }
        this._user.set(res.user);
        this.isAuthenticated.set(true);
        this._loading.set(false);
        this.router.navigate(['/']);
      },
      error: () => this._loading.set(false),
    });
  }

  logout() {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.TOKEN_KEY);
        }
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
      },
      error: () => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.TOKEN_KEY);
        }
        this.isAuthenticated.set(false);
      },
    });
  }

  hasRole(role: string): boolean {
    const user = this._user();
    if (!user?.roles) return false;
    if (role === 'author') return user.roles.includes('admin') || user.roles.includes('author');
    return user.roles.includes(role);
  }
}
