import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Data } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { BlogService } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';
import { Post } from '../../../core/models';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe, FormsModule],
  templateUrl: './post-detail.component.html',
})
export class PostDetailComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);

  post = signal<Post | null>(null);
  loading = signal(true);
  renderedContent = signal<string>('');
  newComment = signal('');
  commenting = signal(false);
  replyingTo = signal<number | null>(null);
  replyContent = signal('');
  copied = signal(false);

  ngOnInit() {
    this.route.data.subscribe((data: Data) => {
      if (data['post']) {
        const post = data['post'] as Post;
        this.post.set(post);
        this.renderedContent.set(DOMPurify.sanitize(marked.parse(post.content) as string));
        this.title.setTitle(`${post.title} — DevBlog`);
        this.meta.updateTag({ name: 'description', content: post.excerpt ?? post.title });
        this.loading.set(false);
      }
    });
  }

  loadPost(slug: string) {
    this.loading.set(true);
    this.blogService.getPost(slug).subscribe({
      next: (post) => {
        this.post.set(post);
        this.renderedContent.set(DOMPurify.sanitize(marked.parse(post.content) as string));
        this.title.setTitle(`${post.title} — DevBlog`);
        this.meta.updateTag({ name: 'description', content: post.excerpt ?? post.title });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submitComment() {
    const content = this.newComment().trim();
    if (!content) return;

    this.commenting.set(true);
    this.blogService.addComment(this.post()!.id, content).subscribe({
      next: () => {
        this.newComment.set('');
        this.commenting.set(false);
        this.loadPost(this.post()!.slug);
      },
      error: () => this.commenting.set(false),
    });
  }

  startReply(commentId: number) {
    this.replyingTo.set(commentId);
    this.replyContent.set('');
  }

  cancelReply() {
    this.replyingTo.set(null);
    this.replyContent.set('');
  }

  submitReply(parentId: number) {
    const content = this.replyContent().trim();
    if (!content) return;

    this.commenting.set(true);
    this.blogService.addComment(this.post()!.id, content, parentId).subscribe({
      next: () => {
        this.replyContent.set('');
        this.replyingTo.set(null);
        this.commenting.set(false);
        this.loadPost(this.post()!.slug);
      },
      error: () => this.commenting.set(false),
    });
  }

  deleteComment(id: number) {
    if (!confirm('Delete this comment?')) return;
    this.blogService.deleteComment(id).subscribe({
      next: () => this.loadPost(this.post()!.slug),
    });
  }

  sharePost() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: this.post()?.title,
        url: window.location.href,
      });
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  get readingTime(): number {
    const content = this.post()?.content ?? '';
    const words = content.split(/\s+/).length;
    return Math.ceil(words / 200);
  }
}
