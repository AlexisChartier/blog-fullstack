import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../../core/services/blog.service';
import { Post, Category, Tag } from '../../../core/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe, FormsModule],
  templateUrl: './post-list.component.html',
})
export class PostListComponent implements OnInit {
  private blogService = inject(BlogService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  posts = signal<Post[]>([]);
  categories = signal<Category[]>([]);
  tags = signal<Tag[]>([]);
  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);
  loading = signal(true);

  currentFilter = signal<{ search?: string; category?: string; tag?: string }>({});
  pageTitle = signal('Latest Posts');

  searchQuery = signal('');
  private searchTimeout: any;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.currentFilter.set({ search: params['search'] });
        this.pageTitle.set(`Search: "${params['search']}"`);
        this.loadPosts();
      }
    });

    this.route.paramMap.subscribe(params => {
      if (params.has('slug')) {
        const slug = params.get('slug')!;
        if (this.route.snapshot.url[0]?.path === 'category') {
          this.currentFilter.set({ category: slug });
          this.pageTitle.set(`Category: ${slug.replace(/-/g, ' ')}`);
        } else if (this.route.snapshot.url[0]?.path === 'tag') {
          this.currentFilter.set({ tag: slug });
          this.pageTitle.set(`#${slug}`);
        }
        this.loadPosts();
      } else if (!this.route.snapshot.queryParams['search']) {
        this.currentFilter.set({});
        this.pageTitle.set('Latest Posts');
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
    if (this.currentPage() < this.lastPage()) {
      this.loadPosts(this.currentPage() + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.loadPosts(this.currentPage() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.lastPage() && page !== this.currentPage()) {
      this.loadPosts(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSearchInput() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if (this.searchQuery().trim()) {
        this.currentFilter.set({ search: this.searchQuery().trim() });
        this.pageTitle.set(`Search: "${this.searchQuery().trim()}"`);
      } else {
        this.currentFilter.set({});
        this.pageTitle.set('Latest Posts');
      }
      this.loadPosts();
    }, 400);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.currentFilter.set({});
    this.pageTitle.set('Latest Posts');
    this.router.navigate(['/']);
    this.loadPosts();
  }

  get hasFilter(): boolean {
    return !!(this.currentFilter().search || this.currentFilter().category || this.currentFilter().tag);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage() - 2);
    const end = Math.min(this.lastPage(), this.currentPage() + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
