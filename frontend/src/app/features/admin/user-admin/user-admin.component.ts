import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { BlogService } from '../../../core/services/blog.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './user-admin.component.html',
})
export class UserAdminComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  users = signal<User[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  lastPage = signal(1);
  error = signal('');

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(page = 1) {
    this.loading.set(true);
    this.error.set('');
    this.blogService.getUsers(page).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.currentPage.set(res.current_page);
        this.lastPage.set(res.last_page);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load users');
      },
    });
  }

  changeRole(user: User, role: string) {
    this.blogService.updateUserRole(user.id, role).subscribe({
      next: () => {
        this.loadUsers(this.currentPage());
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Failed to update role');
      },
    });
  }

  nextPage() {
    if (this.currentPage() < this.lastPage()) {
      this.loadUsers(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.loadUsers(this.currentPage() - 1);
    }
  }

  getRoleClass(roles?: string[]): string {
    if (roles?.includes('admin')) return 'badge-primary';
    if (roles?.includes('author')) return 'badge-accent';
    return 'badge-gray';
  }
}
