import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);

  name = signal('');
  username = signal('');
  email = signal('');
  password = signal('');
  passwordConfirmation = signal('');
  localError = signal('');
  readonly loading = this.auth.loading;
  readonly serverError = this.auth.error;

  submit() {
    this.localError.set('');
    if (!this.name().trim() || !this.username().trim() || !this.email().trim() || !this.password().trim()) {
      this.localError.set('Please fill in all fields.');
      return;
    }
    if (this.password() !== this.passwordConfirmation()) {
      this.localError.set('Passwords do not match.');
      return;
    }
    if (this.password().length < 8) {
      this.localError.set('Password must be at least 8 characters.');
      return;
    }
    this.auth.register(this.name().trim(), this.username().trim(), this.email().trim(), this.password());
  }

  get error(): string {
    return this.localError() || this.serverError() || '';
  }
}
