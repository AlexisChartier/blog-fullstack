import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PostFormComponent } from './post-form.component';
import { BlogService } from '../../../core/services/blog.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { ActivatedRoute, Router } from '@angular/router';
import { Post, Category, Tag, Paginated } from '../../../core/models';

describe('PostFormComponent', () => {
  let component: PostFormComponent;
  let fixture: ComponentFixture<PostFormComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let routeStub: { snapshot: { paramMap: { get: (key: string) => string | null } } };

  const mockCategories: Category[] = [
    { id: 1, name: 'Tech', slug: 'tech', description: null },
    { id: 2, name: 'Laravel', slug: 'laravel', description: null },
  ];

  const mockTags: Tag[] = [
    { id: 1, name: 'php', slug: 'php' },
    { id: 2, name: 'angular', slug: 'angular' },
  ];

  const mockPost: Post = {
    id: 5, title: 'Existing Post', slug: 'existing-post', excerpt: 'Excerpt',
    content: 'Content', featured_image: null, status: 'published',
    published_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    categories: [{ id: 1, name: 'Tech', slug: 'tech', description: null }],
    tags: [{ id: 2, name: 'angular', slug: 'angular' }],
  };

  const mockPaginated: Paginated<Post> = {
    data: [mockPost],
    current_page: 1, last_page: 1, per_page: 10, total: 1,
    from: 1, to: 1, prev_page_url: null, next_page_url: null,
  };

  beforeEach(async () => {
    routeStub = { snapshot: { paramMap: { get: () => null } } };

    await TestBed.configureTestingModule({
      imports: [PostFormComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: API_URL, useValue: '/api' },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();

    httpMock.expectOne('/api/categories').flush({ data: mockCategories });
    httpMock.expectOne('/api/tags').flush({ data: mockTags });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in create mode (not edit)', () => {
    expect(component.isEdit()).toBe(false);
    expect(component.postId()).toBeNull();
  });

  it('should load categories and tags on init', () => {
    expect(component.categories()).toEqual(mockCategories);
    expect(component.tags()).toEqual(mockTags);
  });

  it('should start with default status draft', () => {
    expect(component.status()).toBe('draft');
  });

  describe('edit mode', () => {
    beforeEach(() => {
      routeStub.snapshot.paramMap.get = (key: string) => key === 'id' ? '5' : null;
      component.ngOnInit();
      httpMock.expectOne('/api/categories').flush({ data: mockCategories });
      httpMock.expectOne('/api/tags').flush({ data: mockTags });
      httpMock.expectOne('/api/posts?page=1').flush(mockPaginated);
      fixture.detectChanges();
    });

    it('should set isEdit true and postId from route', () => {
      expect(component.isEdit()).toBe(true);
      expect(component.postId()).toBe(5);
    });

    it('should load post data', () => {
      expect(component.title()).toBe('Existing Post');
      expect(component.excerpt()).toBe('Excerpt');
      expect(component.content()).toBe('Content');
      expect(component.status()).toBe('published');
      expect(component.publishedAt()).toBe('2026-01-01T00:00:00Z');
      expect(component.selectedCategories()).toEqual([1]);
      expect(component.selectedTags()).toEqual([2]);
    });
  });

  describe('toggleCategory', () => {
    it('should add category when not selected', () => {
      component.selectedCategories.set([1]);
      component.toggleCategory(2);
      expect(component.selectedCategories()).toEqual([1, 2]);
    });

    it('should remove category when already selected', () => {
      component.selectedCategories.set([1, 2]);
      component.toggleCategory(1);
      expect(component.selectedCategories()).toEqual([2]);
    });
  });

  describe('toggleTag', () => {
    it('should add tag when not selected', () => {
      component.selectedTags.set([]);
      component.toggleTag(1);
      expect(component.selectedTags()).toEqual([1]);
    });

    it('should remove tag when already selected', () => {
      component.selectedTags.set([1, 2]);
      component.toggleTag(2);
      expect(component.selectedTags()).toEqual([1]);
    });
  });

  describe('submit (create mode)', () => {
    it('should POST and navigate to /admin/posts on success', fakeAsync(() => {
      component.title.set('New Post');
      component.content.set('Content body');
      component.status.set('draft');
      component.selectedCategories.set([1]);
      component.selectedTags.set([2]);

      component.submit();

      const req = httpMock.expectOne('/api/posts');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        title: 'New Post',
        excerpt: '',
        content: 'Content body',
        status: 'draft',
        published_at: null,
        categories: [1],
        tags: [2],
      });
      req.flush({ message: 'Post created', post: { ...mockPost, id: 10 } });
      tick();

      expect(router.navigate as jasmine.Spy).toHaveBeenCalledWith(['/admin/posts']);
      expect(component.error()).toBe('');
    }));

    it('should set error on failure', fakeAsync(() => {
      component.submit();

      const req = httpMock.expectOne('/api/posts');
      req.flush({ message: 'Validation error' }, { status: 422, statusText: 'Unprocessable' });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.error()).toBe('Validation error');
    }));

    it('should set generic error when no message', fakeAsync(() => {
      component.submit();

      const req = httpMock.expectOne('/api/posts');
      req.flush({}, { status: 500, statusText: 'Server Error' });
      tick();

      expect(component.error()).toBe('An error occurred.');
    }));
  });

  describe('submit (edit mode)', () => {
    beforeEach(() => {
      routeStub.snapshot.paramMap.get = (key: string) => key === 'id' ? '5' : null;
      component.ngOnInit();
      httpMock.expectOne('/api/categories').flush({ data: mockCategories });
      httpMock.expectOne('/api/tags').flush({ data: mockTags });
      httpMock.expectOne('/api/posts?page=1').flush(mockPaginated);
      fixture.detectChanges();
    });

    it('should PUT and navigate to /admin/posts on success', fakeAsync(() => {
      component.title.set('Updated Title');

      component.submit();

      const req = httpMock.expectOne('/api/posts/5');
      expect(req.request.method).toBe('PUT');
      req.flush({ message: 'Post updated', post: mockPost });
      tick();

      expect(router.navigate as jasmine.Spy).toHaveBeenCalledWith(['/admin/posts']);
      expect(component.error()).toBe('');
    }));

    it('should set error on failure', fakeAsync(() => {
      component.submit();

      const req = httpMock.expectOne('/api/posts/5');
      req.flush({ message: 'Error updating' }, { status: 500, statusText: 'Server Error' });
      tick();

      expect(component.error()).toBe('Error updating');
    }));
  });

  describe('template rendering', () => {
    it('should render title input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[name="title"]')).toBeTruthy();
    });

    it('should render content textarea', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('textarea[name="content"]')).toBeTruthy();
    });

    it('should render status select', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('select[name="status"]')).toBeTruthy();
    });

    it('should render Create Post button in create mode', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Create Post');
    });

    it('should render category checkboxes', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Tech');
      expect(el.textContent).toContain('Laravel');
    });

    it('should render tag checkboxes', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('php');
      expect(el.textContent).toContain('angular');
    });
  });
});
