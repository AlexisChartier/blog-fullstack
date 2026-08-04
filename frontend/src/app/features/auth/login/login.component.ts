import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);

  email = signal('');
  password = signal('');
  localError = signal('');
  readonly loading = this.auth.loading;
  readonly serverError = this.auth.error;

  submit() {
    this.localError.set('');
    if (!this.email().trim() || !this.password().trim()) {
      this.localError.set('Please fill in all fields.');
      return;
    }
    this.auth.login(this.email().trim(), this.password());
  }

  get error(): string {
    return this.localError() || this.serverError() || '';
  }
}
