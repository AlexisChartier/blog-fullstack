import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIf, NgFor],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;

  logout() {
    this.auth.logout();
  }

  get isAdmin() {
    return this.auth.hasRole('admin');
  }

  get isAuthor() {
    return this.auth.hasRole('author');
  }
}
