import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../core/services/blog.service';
import { Comment } from '../../../core/models';

@Component({
  selector: 'app-comment-admin',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink],
  templateUrl: './comment-admin.component.html',
})
export class CommentAdminComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  comments = signal<Comment[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  lastPage = signal(1);
  error = signal('');

  ngOnInit() {
    this.loadComments();
  }

  loadComments(page = 1) {
    this.loading.set(true);
    this.blogService.getComments(page).subscribe({
      next: (res) => {
        this.comments.set(res.data);
        this.currentPage.set(res.current_page);
        this.lastPage.set(res.last_page);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleApproval(comment: Comment) {
    this.error.set('');
    this.blogService.updateComment(comment.id, { is_approved: !comment.is_approved }).subscribe({
      next: (res) => {
        const updated = res.comment;
        this.comments.update(list =>
          list.map(c => c.id === updated.id ? { ...c, is_approved: updated.is_approved } : c),
        );
      },
      error: (err) => this.error.set(err.error?.message ?? 'Failed to update comment'),
    });
  }

  deleteComment(id: number) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    this.error.set('');
    this.blogService.deleteComment(id).subscribe({
      next: () => this.loadComments(this.currentPage()),
      error: (err) => this.error.set(err.error?.message ?? 'Failed to delete comment'),
    });
  }

  nextPage() {
    if (this.currentPage() < this.lastPage()) {
      this.loadComments(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.loadComments(this.currentPage() - 1);
    }
  }
}
