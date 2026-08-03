import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { BlogService } from '../../../core/services/blog.service';
import { Category, Tag } from '../../../core/models';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, RouterLink],
  templateUrl: './post-form.component.html',
})
export class PostFormComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEdit = signal(false);
  postId = signal<number | null>(null);
  saving = signal(false);
  error = signal('');

  title = signal('');
  excerpt = signal('');
  content = signal('');
  status = signal<'draft' | 'published'>('draft');
  publishedAt = signal('');

  categories = signal<Category[]>([]);
  tags = signal<Tag[]>([]);
  selectedCategories = signal<number[]>([]);
  selectedTags = signal<number[]>([]);

  ngOnInit() {
    this.loadCategoriesAndTags();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.postId.set(Number(id));
      this.loadPost(Number(id));
    }
  }

  loadCategoriesAndTags() {
    this.blogService.getCategories().subscribe(cats => this.categories.set(cats));
    this.blogService.getTags().subscribe(tags => this.tags.set(tags));
  }

  loadPost(id: number) {
    this.blogService.getPosts(1).subscribe(res => {
      const post = res.data.find(p => p.id === id);
      if (post) {
        this.title.set(post.title);
        this.excerpt.set(post.excerpt ?? '');
        this.content.set(post.content);
        this.status.set(post.status);
        this.publishedAt.set(post.published_at ?? '');
        this.selectedCategories.set(post.categories?.map(c => c.id) ?? []);
        this.selectedTags.set(post.tags?.map(t => t.id) ?? []);
      }
    });
  }

  toggleCategory(id: number) {
    const current = [...this.selectedCategories()];
    const idx = current.indexOf(id);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(id);
    this.selectedCategories.set(current);
  }

  toggleTag(id: number) {
    const current = [...this.selectedTags()];
    const idx = current.indexOf(id);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(id);
    this.selectedTags.set(current);
  }

  submit() {
    this.saving.set(true);
    this.error.set('');

    const data = {
      title: this.title(),
      excerpt: this.excerpt(),
      content: this.content(),
      status: this.status(),
      published_at: this.publishedAt() || null,
      categories: this.selectedCategories(),
      tags: this.selectedTags(),
    };

    if (this.isEdit()) {
      this.blogService.updatePost(this.postId()!, data).subscribe({
        next: () => this.router.navigate(['/admin/posts']),
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'An error occurred.');
        },
      });
    } else {
      this.blogService.createPost(data).subscribe({
        next: () => this.router.navigate(['/admin/posts']),
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'An error occurred.');
        },
      });
    }
  }
}
