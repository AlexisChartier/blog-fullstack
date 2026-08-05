import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AllPostsComponent } from './all-posts.component';
import { BlogService } from '../../../core/services/blog.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { Post } from '../../../core/models';

describe('AllPostsComponent', () => {
  let component: AllPostsComponent;
  let fixture: ComponentFixture<AllPostsComponent>;
  let httpMock: HttpTestingController;

  const mockPosts: Post[] = [
    { id: 1, title: 'Post 1', slug: 'post-1', excerpt: 'E1', content: 'C1', featured_image: null, status: 'published', published_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', author: { id: 2, name: 'Author 1', username: 'author1', avatar_url: null, bio: null, created_at: '2026-01-01T00:00:00Z' } },
    { id: 2, title: 'Post 2', slug: 'post-2', excerpt: 'E2', content: 'C2', featured_image: null, status: 'draft', published_at: null, created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z', author: { id: 3, name: 'Author 2', username: 'author2', avatar_url: null, bio: null, created_at: '2026-01-01T00:00:00Z' } },
  ];

  const mockPaginated = {
    data: mockPosts,
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 2,
    from: 1,
    to: 2,
    prev_page_url: null,
    next_page_url: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPostsComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: API_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AllPostsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne('/api/admin/posts?page=1').flush(mockPaginated);
    expect(component).toBeTruthy();
  });

  it('should load posts on init', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/posts?page=1');
    req.flush(mockPaginated);
    tick();

    expect(component.posts()).toEqual(mockPosts);
    expect(component.loading()).toBe(false);
  }));

  it('should set loading false on error', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/posts?page=1');
    req.flush({}, { status: 403, statusText: 'Forbidden' });
    tick();

    expect(component.loading()).toBe(false);
  }));

  it('should delete post and reload', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);

    const req = httpMock.expectOne('/api/admin/posts?page=1');
    req.flush(mockPaginated);
    tick();

    component.deletePost(1);

    const deleteReq = httpMock.expectOne('/api/posts/1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({ message: 'Post deleted' });
    tick();

    const reloadReq = httpMock.expectOne('/api/admin/posts?page=1');
    reloadReq.flush(mockPaginated);
    tick();
  }));

  it('should not delete when confirm is cancelled', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(false);

    const req = httpMock.expectOne('/api/admin/posts?page=1');
    req.flush(mockPaginated);
    tick();

    component.deletePost(1);
    httpMock.expectNone('/api/posts/1');
  }));

  it('should load next page', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/posts?page=1');
    req.flush({ ...mockPaginated, last_page: 3 });
    tick();

    component.nextPage();

    const req2 = httpMock.expectOne('/api/admin/posts?page=2');
    req2.flush({ ...mockPaginated, data: [], current_page: 2 });
    tick();

    expect(component.currentPage()).toBe(2);
  }));

  it('should not go before page 1', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/posts?page=1');
    req.flush(mockPaginated);
    tick();

    component.prevPage();
    expect(component.currentPage()).toBe(1);
    httpMock.expectNone('/api/admin/posts?page=0');
  }));
});
