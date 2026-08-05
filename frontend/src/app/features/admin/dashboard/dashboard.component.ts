import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../core/services/blog.service';
import { AdminStats } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  stats = signal<AdminStats | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.blogService.getAdminStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
