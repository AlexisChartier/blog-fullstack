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
  private auth = inject(AuthService);

  email = signal('');
  password = signal('');
  error = signal('');
  readonly loading = this.auth.loading;

  submit() {
    this.error.set('');
    if (!this.email() || !this.password()) {
      this.error.set('Please fill in all fields.');
      return;
    }
    this.auth.login(this.email(), this.password());
  }
}
