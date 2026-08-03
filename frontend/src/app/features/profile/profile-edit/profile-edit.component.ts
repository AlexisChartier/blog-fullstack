import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './profile-edit.component.html',
})
export class ProfileEditComponent {
  private userService = inject(UserService);
  private auth = inject(AuthService);

  name = signal('');
  username = signal('');
  bio = signal('');
  saving = signal(false);
  success = signal(false);
  error = signal('');

  constructor() {
    const user = this.auth.user();
    if (user) {
      this.name.set(user.name);
      this.username.set(user.username);
      this.bio.set(user.bio ?? '');
    }
  }

  submit() {
    this.saving.set(true);
    this.success.set(false);
    this.error.set('');

    const formData = new FormData();
    formData.append('name', this.name());
    formData.append('username', this.username());
    formData.append('bio', this.bio());

    this.userService.updateProfile(formData).subscribe({
      next: () => {
        this.auth.fetchUser();
        this.saving.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'An error occurred.');
      },
    });
  }
}
