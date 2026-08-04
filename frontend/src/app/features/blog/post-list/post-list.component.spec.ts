import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PostListComponent } from './post-list.component';
import { BlogService } from '../../../core/services/blog.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { ActivatedRoute, Router, Data } from '@angular/router';
import { Post, Category, Tag, Paginated } from '../../../core/models';

describe('PostListComponent', () => {
  let component: PostListComponent;
  let fixture: ComponentFixture<PostListComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockPost: Post = {
    id: 1, title: 'Test Post', slug: 'test-post', excerpt: 'Excerpt', content: 'Content',
    featured_image: null, status: 'published', published_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    author: { id: 1, name: 'Author', username: 'author', avatar_url: null, bio: null, created_at: '' },
    categories: [{ id: 1, name: 'Tech', slug: 'tech', description: null }],
    tags: [{ id: 1, name: 'php', slug: 'php' }],
  };

  const mockPaginated: Paginated<Post> = {
    data: [mockPost],
    current_page: 1, last_page: 2, per_page: 10, total: 15,
    from: 1, to: 10, prev_page_url: null, next_page_url: 'http://localhost/api/posts?page=2',
  };

  const mockCategories: Category[] = [
    { id: 1, name: 'Tech', slug: 'tech', description: null, posts_count: 5 },
  ];

  const mockTags: Tag[] = [
    { id: 1, name: 'php', slug: 'php', posts_count: 3 },
  ];

  function setupRouteData(data: Partial<Record<string, unknown>>) {
    const route = TestBed.inject(ActivatedRoute);
    (route.data as any) = { subscribe: (cb: (d: Data) => void) => cb(data as Data) };
    (route.snapshot as any) = {
      queryParams: {},
      paramMap: { get: () => null },
      url: [],
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostListComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: API_URL, useValue: '/api' },
        {
          provide: ActivatedRoute,
          useValue: {
            data: { subscribe: (cb: (d: Data) => void) => cb({} as Data) },
            snapshot: { queryParams: {}, paramMap: { get: () => null }, url: [] },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading true and empty signals', () => {
    expect(component.loading()).toBe(true);
    expect(component.posts()).toEqual([]);
    expect(component.categories()).toEqual([]);
    expect(component.tags()).toEqual([]);
    expect(component.pageTitle()).toBe('Latest Posts');
    expect(component.currentPage()).toBe(1);
    expect(component.lastPage()).toBe(1);
    expect(component.total()).toBe(0);
  });

  describe('ngOnInit with route data', () => {
    it('should load posts from route data', () => {
      setupRouteData({
        posts: mockPaginated,
        categories: mockCategories,
        tags: mockTags,
      });
      component.ngOnInit();
      expect(component.posts()).toEqual([mockPost]);
      expect(component.currentPage()).toBe(1);
      expect(component.lastPage()).toBe(2);
      expect(component.total()).toBe(15);
      expect(component.loading()).toBe(false);
      expect(component.categories()).toEqual(mockCategories);
      expect(component.tags()).toEqual(mockTags);
    });

    it('should set page title from search query param', () => {
      const route = TestBed.inject(ActivatedRoute);
      (route.data as any) = { subscribe: (cb: (d: Data) => void) => cb({} as Data) };
      (route.snapshot as any) = {
        queryParams: { search: 'angular' },
        paramMap: { get: () => null },
        url: [],
      };
      component.ngOnInit();
      expect(component.pageTitle()).toBe('Search: "angular"');
      expect(component.currentFilter().search).toBe('angular');
    });

    it('should set page title for category route', () => {
      const route = TestBed.inject(ActivatedRoute);
      (route.data as any) = { subscribe: (cb: (d: Data) => void) => cb({} as Data) };
      (route.snapshot as any) = {
        queryParams: {},
        paramMap: { get: (key: string) => key === 'slug' ? 'web-dev' : null },
        url: [{ path: 'category' }],
      };
      component.ngOnInit();
      expect(component.pageTitle()).toBe('Category: web dev');
      expect(component.currentFilter().category).toBe('web-dev');
    });

    it('should set page title for tag route', () => {
      const route = TestBed.inject(ActivatedRoute);
      (route.data as any) = { subscribe: (cb: (d: Data) => void) => cb({} as Data) };
      (route.snapshot as any) = {
        queryParams: {},
        paramMap: { get: (key: string) => key === 'slug' ? 'angular' : null },
        url: [{ path: 'tag' }],
      };
      component.ngOnInit();
      expect(component.pageTitle()).toBe('#angular');
      expect(component.currentFilter().tag).toBe('angular');
    });

    it('should not set filter when slug is from unknown route segment', () => {
      const route = TestBed.inject(ActivatedRoute);
      (route.data as any) = { subscribe: (cb: (d: Data) => void) => cb({} as Data) };
      (route.snapshot as any) = {
        queryParams: {},
        paramMap: { get: (key: string) => key === 'slug' ? 'unknown' : null },
        url: [{ path: 'profile' }],
      };
      component.ngOnInit();
      expect(component.pageTitle()).toBe('Latest Posts');
      expect(component.currentFilter()).toEqual({});
    });

    it('should load only categories from route data (no posts, no tags)', () => {
      setupRouteData({ categories: mockCategories });
      component.ngOnInit();
      expect(component.categories()).toEqual(mockCategories);
      expect(component.tags()).toEqual([]);
      expect(component.posts()).toEqual([]);
      expect(component.loading()).toBe(true);
    });

    it('should load only tags from route data (no posts, no categories)', () => {
      setupRouteData({ tags: mockTags });
      component.ngOnInit();
      expect(component.tags()).toEqual(mockTags);
      expect(component.categories()).toEqual([]);
    });
  });

  describe('loadPosts', () => {
    it('should call BlogService.getPosts and update signals', fakeAsync(() => {
      component.currentFilter.set({ search: 'test' });
      component.loadPosts(2);

      const req = httpMock.expectOne('/api/posts?page=2&search=test');
      req.flush(mockPaginated);
      tick();

      expect(component.posts()).toEqual([mockPost]);
      expect(component.currentPage()).toBe(1);
      expect(component.loading()).toBe(false);
    }));

    it('should set loading false on error', fakeAsync(() => {
      component.loadPosts(1);

      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush({}, { status: 500, statusText: 'Server Error' });
      tick();

      expect(component.loading()).toBe(false);
    }));
  });

  describe('pagination', () => {
    beforeEach(() => {
      component.currentPage.set(2);
      component.lastPage.set(5);
    });

    it('nextPage should load next page', fakeAsync(() => {
      component.nextPage();
      const req = httpMock.expectOne('/api/posts?page=3');
      req.flush(mockPaginated);
      tick();
      expect(component.currentPage()).toBe(1);
    }));

    it('nextPage should not go beyond last page', () => {
      component.currentPage.set(5);
      component.lastPage.set(5);
      component.nextPage();
      expect(component.currentPage()).toBe(5);
    });

    it('nextPage should scroll to top', fakeAsync(() => {
      const scrollSpy = spyOn(window, 'scrollTo') as any;
      component.nextPage();
      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      const req = httpMock.expectOne('/api/posts?page=3');
      req.flush(mockPaginated);
      tick();
    }));

    it('prevPage should scroll to top', fakeAsync(() => {
      const scrollSpy = spyOn(window, 'scrollTo') as any;
      component.prevPage();
      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush(mockPaginated);
      tick();
    }));

    it('prevPage should load previous page', fakeAsync(() => {
      component.prevPage();
      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush(mockPaginated);
      tick();
      expect(component.currentPage()).toBe(1);
    }));

    it('prevPage should not go below page 1', () => {
      component.currentPage.set(1);
      component.prevPage();
      expect(component.currentPage()).toBe(1);
    });

    it('goToPage should load specified page', fakeAsync(() => {
      component.goToPage(4);
      expect(component.loading()).toBe(true);
      const req = httpMock.expectOne('/api/posts?page=4');
      req.flush(mockPaginated);
      tick();
    }));

    it('goToPage should not reload same page', () => {
      component.currentPage.set(2);
      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
      httpMock.expectNone('/api/posts?page=2');
    });

    it('goToPage should not go below 1', () => {
      component.currentPage.set(2);
      component.goToPage(0);
      expect(component.currentPage()).toBe(2);
      httpMock.expectNone('/api/posts?page=0');
    });

    it('goToPage should not go above lastPage', () => {
      component.currentPage.set(2);
      component.lastPage.set(5);
      component.goToPage(6);
      expect(component.currentPage()).toBe(2);
      httpMock.expectNone('/api/posts?page=6');
    });

    it('goToPage should scroll to top on valid page', fakeAsync(() => {
      const scrollSpy = spyOn(window, 'scrollTo') as any;
      component.lastPage.set(5);
      component.goToPage(4);
      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      const req = httpMock.expectOne('/api/posts?page=4');
      req.flush(mockPaginated);
      tick();
    }));
  });

  describe('pageNumbers getter', () => {
    it('should return range of pages around current', () => {
      component.currentPage.set(5);
      component.lastPage.set(10);
      expect(component.pageNumbers).toEqual([3, 4, 5, 6, 7]);
    });

    it('should clamp to start', () => {
      component.currentPage.set(1);
      component.lastPage.set(10);
      expect(component.pageNumbers).toEqual([1, 2, 3]);
    });

    it('should clamp to end', () => {
      component.currentPage.set(9);
      component.lastPage.set(10);
      expect(component.pageNumbers).toEqual([7, 8, 9, 10]);
    });
  });

  describe('hasFilter getter', () => {
    it('should return false when no filter set', () => {
      component.currentFilter.set({});
      expect(component.hasFilter).toBe(false);
    });

    it('should return true when search set', () => {
      component.currentFilter.set({ search: 'test' });
      expect(component.hasFilter).toBe(true);
    });

    it('should return true when category set', () => {
      component.currentFilter.set({ category: 'tech' });
      expect(component.hasFilter).toBe(true);
    });

    it('should return true when tag set', () => {
      component.currentFilter.set({ tag: 'php' });
      expect(component.hasFilter).toBe(true);
    });
  });

  describe('onSearchInput', () => {
    it('should debounce and set search filter', fakeAsync(() => {
      component.searchQuery.set('angular');
      component.onSearchInput();
      tick(400);
      expect(component.currentFilter().search).toBe('angular');
      expect(component.pageTitle()).toBe('Search: "angular"');
      const req = httpMock.expectOne('/api/posts?page=1&search=angular');
      req.flush(mockPaginated);
      tick();
    }));

    it('should clear filter when search is empty', fakeAsync(() => {
      component.searchQuery.set('');
      component.onSearchInput();
      tick(400);
      expect(component.currentFilter()).toEqual({});
      expect(component.pageTitle()).toBe('Latest Posts');
      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush(mockPaginated);
      tick();
    }));

    it('should clear previous timeout on rapid typing', fakeAsync(() => {
      component.searchQuery.set('first');
      component.onSearchInput();
      component.searchQuery.set('second');
      component.onSearchInput();
      tick(400);
      expect(component.currentFilter().search).toBe('second');
      const req = httpMock.expectOne('/api/posts?page=1&search=second');
      req.flush(mockPaginated);
      tick();
    }));

    it('should trim whitespace from search query', fakeAsync(() => {
      component.searchQuery.set('  spaced query  ');
      component.onSearchInput();
      tick(400);
      expect(component.currentFilter().search).toBe('spaced query');
      const req = httpMock.expectOne('/api/posts?page=1&search=spaced%20query');
      req.flush(mockPaginated);
      tick();
    }));
  });

  describe('clearFilters', () => {
    it('should reset all filters and navigate to /', fakeAsync(() => {
      component.searchQuery.set('test');
      component.currentFilter.set({ search: 'test' });
      component.pageTitle.set('Search: "test"');

      component.clearFilters();

      expect(component.searchQuery()).toBe('');
      expect(component.currentFilter()).toEqual({});
      expect(component.pageTitle()).toBe('Latest Posts');
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush(mockPaginated);
      tick();
    }));
  });

  describe('template rendering', () => {
    it('should render search input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[type="text"]')).toBeTruthy();
    });

    it('should render page title', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Latest Posts');
    });

    it('should render skeleton loaders when loading', () => {
      component.loading.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    });

    it('should render empty state when no posts and not loading', () => {
      component.loading.set(false);
      component.posts.set([]);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No posts found');
    });

    it('should render post cards when posts loaded', () => {
      component.loading.set(false);
      component.posts.set([mockPost]);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Test Post');
      expect(el.textContent).toContain('Author');
    });

    it('should render categories sidebar', () => {
      component.categories.set(mockCategories);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Tech');
    });

    it('should render tags sidebar', () => {
      component.tags.set(mockTags);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('php');
    });

    it('should render pagination when lastPage > 1', () => {
      component.loading.set(false);
      component.posts.set([mockPost]);
      component.currentPage.set(1);
      component.lastPage.set(3);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Prev');
      expect(el.textContent).toContain('Next');
    });

    it('should render clear filter badge when filter active', () => {
      component.currentFilter.set({ search: 'test' });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Clear filter');
    });

    it('should render total article count', () => {
      component.total.set(5);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('5 articles');
    });

    it('should render singular article count for 1', () => {
      component.total.set(1);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('1 article');
    });
  });
});
