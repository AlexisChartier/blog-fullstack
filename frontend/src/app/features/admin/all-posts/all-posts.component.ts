import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../core/services/blog.service';
import { Post } from '../../../core/models';

@Component({
  selector: 'app-all-posts',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe],
  templateUrl: './all-posts.component.html',
})
export class AllPostsComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  posts = signal<Post[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  lastPage = signal(1);

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts(page = 1) {
    this.loading.set(true);
    this.blogService.getAllPosts(page).subscribe({
      next: (res) => {
        this.posts.set(res.data);
        this.currentPage.set(res.current_page);
        this.lastPage.set(res.last_page);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  nextPage() {
    if (this.currentPage() < this.lastPage()) {
      this.loadPosts(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.loadPosts(this.currentPage() - 1);
    }
  }

  deletePost(id: number) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    this.blogService.deletePost(id).subscribe({
      next: () => this.loadPosts(this.currentPage()),
    });
  }
}
