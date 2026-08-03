import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, Data } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../../core/services/blog.service';
import { Post, Category, Tag, Paginated } from '../../../core/models';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe, FormsModule],
  templateUrl: './post-list.component.html',
})
export class PostListComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

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
    this.route.data.subscribe((data: Data) => {
      if (data['posts']) {
        const res = data['posts'] as Paginated<Post>;
        this.posts.set(res.data);
        this.currentPage.set(res.current_page);
        this.lastPage.set(res.last_page);
        this.total.set(res.total);
        this.loading.set(false);
      }
      if (data['categories']) {
        this.categories.set(data['categories'] as Category[]);
      }
      if (data['tags']) {
        this.tags.set(data['tags'] as Tag[]);
      }

      const search = this.route.snapshot.queryParams['search'];
      const slug = this.route.snapshot.paramMap.get('slug');
      if (search) {
        this.currentFilter.set({ search });
        this.pageTitle.set(`Search: "${search}"`);
      } else if (slug) {
        if (this.route.snapshot.url[0]?.path === 'category') {
          this.currentFilter.set({ category: slug });
          this.pageTitle.set(`Category: ${slug.replaceAll('-', ' ')}`);
        } else if (this.route.snapshot.url[0]?.path === 'tag') {
          this.currentFilter.set({ tag: slug });
          this.pageTitle.set(`#${slug}`);
        }
      }
    });
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
