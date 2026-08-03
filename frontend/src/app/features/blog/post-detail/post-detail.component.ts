import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
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
  private blogService = inject(BlogService);
  private route = inject(ActivatedRoute);
  private meta = inject(Meta);
  private title = inject(Title);
  protected auth = inject(AuthService);

  post = signal<Post | null>(null);
  loading = signal(true);
  newComment = signal('');
  commenting = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) this.loadPost(slug);
    });
  }

  loadPost(slug: string) {
    this.loading.set(true);
    this.blogService.getPost(slug).subscribe({
      next: (post) => {
        this.post.set(post);
        this.title.setTitle(`${post.title} - Blog`);
        this.meta.updateTag({ name: 'description', content: post.excerpt ?? post.title });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submitComment(parentId?: number) {
    const content = parentId ? '' : this.newComment().trim();
    if (!content) return;

    this.commenting.set(true);
    this.blogService.addComment(this.post()!.id, content, parentId).subscribe({
      next: () => {
        this.newComment.set('');
        this.commenting.set(false);
        this.loadPost(this.post()!.slug);
      },
      error: () => this.commenting.set(false),
    });
  }
}
