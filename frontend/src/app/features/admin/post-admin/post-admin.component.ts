import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { BlogService } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';
import { Post } from '../../../core/models';

@Component({
  selector: 'app-post-admin',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe],
  templateUrl: './post-admin.component.html',
})
export class PostAdminComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  posts = signal<Post[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.loading.set(true);
    this.blogService.getPosts(1).subscribe({
      next: (res) => {
        this.posts.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  deletePost(id: number) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    this.blogService.deletePost(id).subscribe({
      next: () => this.loadPosts(),
    });
  }

  get currentUser() {
    return this.auth.user();
  }
}
