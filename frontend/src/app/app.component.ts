import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIf, NgFor, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;

  darkMode = signal(false);
  menuOpen = signal(false);
  profileOpen = signal(false);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      if (stored === 'true' || (!stored && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        this.darkMode.set(true);
        document.documentElement.classList.add('dark');
      }
    }

    effect(() => {
      if (typeof document !== 'undefined') {
        if (this.darkMode()) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  toggleDarkMode() {
    const newVal = !this.darkMode();
    this.darkMode.set(newVal);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('darkMode', String(newVal));
    }
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  toggleProfile() {
    this.profileOpen.update(v => !v);
  }

  closeMenus() {
    this.menuOpen.set(false);
    this.profileOpen.set(false);
  }

  logout() {
    this.auth.logout();
    this.closeMenus();
  }

  get isAdmin() {
    return this.auth.hasRole('admin');
  }

  get isAuthor() {
    return this.auth.hasRole('author');
  }
}
