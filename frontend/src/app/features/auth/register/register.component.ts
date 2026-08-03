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
  private auth = inject(AuthService);

  name = signal('');
  username = signal('');
  email = signal('');
  password = signal('');
  passwordConfirmation = signal('');
  error = signal('');
  readonly loading = this.auth.loading;

  submit() {
    this.error.set('');
    if (this.password() !== this.passwordConfirmation()) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.auth.register(this.name(), this.username(), this.email(), this.password());
  }
}
