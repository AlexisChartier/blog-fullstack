import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { BlogService } from '../../../core/services/blog.service';
import { Post, Category, Tag } from '../../../core/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe],
  templateUrl: './post-list.component.html',
})
export class PostListComponent implements OnInit {
  private blogService = inject(BlogService);
  private route = inject(ActivatedRoute);

  posts = signal<Post[]>([]);
  categories = signal<Category[]>([]);
  tags = signal<Tag[]>([]);
  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);
  loading = signal(true);

  currentFilter = signal<{ search?: string; category?: string; tag?: string }>({});
  pageTitle = signal('Latest Posts');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.currentFilter.set({ search: params['search'] });
        this.pageTitle.set(`Search: "${params['search']}"`);
      }
      this.loadPosts();
    });

    this.route.paramMap.subscribe(params => {
      if (params.has('slug')) {
        const slug = params.get('slug')!;
        if (this.route.snapshot.url[0]?.path === 'category') {
          this.currentFilter.set({ category: slug });
          this.pageTitle.set(`Category: ${slug}`);
        } else if (this.route.snapshot.url[0]?.path === 'tag') {
          this.currentFilter.set({ tag: slug });
          this.pageTitle.set(`Tag: ${slug}`);
        }
        this.loadPosts();
      }
    });

    this.loadCategories();
    this.loadTags();
  }

  loadPosts(page = 1) {
    this.loading.set(true);
    this.blogService.getPosts(page, this.currentFilter()).subscribe({
      next: (res) => {
        this.posts.set(res.data);
        this.currentPage.set(res.current_page);
        this.lastPage.set(res.last_page);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadCategories() {
    this.blogService.getCategories().subscribe(cats => this.categories.set(cats));
  }

  loadTags() {
    this.blogService.getTags().subscribe(tags => this.tags.set(tags));
  }

  nextPage() {
    if (this.currentPage() < this.lastPage()) this.loadPosts(this.currentPage() + 1);
  }

  prevPage() {
    if (this.currentPage() > 1) this.loadPosts(this.currentPage() - 1);
  }
}
