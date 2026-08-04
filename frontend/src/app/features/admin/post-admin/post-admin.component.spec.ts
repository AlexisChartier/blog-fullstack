import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PostAdminComponent } from './post-admin.component';
import { BlogService } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { Post, Paginated } from '../../../core/models';
import { signal, WritableSignal } from '@angular/core';

describe('PostAdminComponent', () => {
  let component: PostAdminComponent;
  let fixture: ComponentFixture<PostAdminComponent>;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;
  let userSignal: WritableSignal<any>;

  const mockPosts: Post[] = [
    { id: 1, title: 'Published Post', slug: 'published-post', excerpt: 'E1', content: 'C1', featured_image: null, status: 'published', published_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 2, title: 'Draft Post', slug: 'draft-post', excerpt: 'E2', content: 'C2', featured_image: null, status: 'draft', published_at: null, created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
  ];

  const mockPaginated: Paginated<Post> = {
    data: mockPosts,
    current_page: 1, last_page: 1, per_page: 10, total: 2,
    from: 1, to: 2, prev_page_url: null, next_page_url: null,
  };

  beforeEach(async () => {
    userSignal = signal({ id: 1, name: 'Admin', username: 'admin', avatar_url: null, bio: null, roles: ['admin'], created_at: '' });

    authSpy = jasmine.createSpyObj('AuthService', [], {
      user: userSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [PostAdminComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: AuthService, useValue: authSpy },
        { provide: API_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostAdminComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne('/api/posts?page=1').flush(mockPaginated);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load posts on init', fakeAsync(() => {
    expect(component.posts()).toEqual(mockPosts);
    expect(component.loading()).toBe(false);
    tick();
  }));

  describe('loadPosts', () => {
    it('should fetch posts and update signals', fakeAsync(() => {
      component.loadPosts();

      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush(mockPaginated);
      tick();

      expect(component.posts()).toEqual(mockPosts);
      expect(component.loading()).toBe(false);
    }));

    it('should set loading false on error', fakeAsync(() => {
      component.loadPosts();

      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush({}, { status: 500, statusText: 'Server Error' });
      tick();

      expect(component.loading()).toBe(false);
    }));
  });

  describe('deletePost', () => {
    it('should not delete when confirm is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deletePost(1);
      expect(component.posts()).toHaveSize(2);
      httpMock.expectNone('/api/posts/1');
    });

    it('should delete post and reload list', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);

      component.deletePost(1);

      const deleteReq = httpMock.expectOne('/api/posts/1');
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({ message: 'Deleted' });
      tick();

      const reloadReq = httpMock.expectOne('/api/posts?page=1');
      reloadReq.flush(mockPaginated);
      tick();
    }));
  });

  describe('currentUser getter', () => {
    it('should return current user from auth service', () => {
      expect(component.currentUser).toEqual(userSignal());
    });

    it('should return null when no user', () => {
      userSignal.set(null);
      expect(component.currentUser).toBeNull();
    });
  });

  describe('template rendering', () => {
    it('should render page title', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('My Posts');
    });

    it('should render New Post button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('New Post');
    });

    it('should render post titles', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Published Post');
      expect(el.textContent).toContain('Draft Post');
    }));

    it('should render status badges', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('published');
      expect(el.textContent).toContain('draft');
    }));

    it('should render empty state when no posts', fakeAsync(() => {
      component.posts.set([]);
      component.loading.set(false);
      fixture.detectChanges();
      tick();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No posts yet.');
    }));
  });
});
