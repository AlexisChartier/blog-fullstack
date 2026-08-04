import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BlogService } from './blog.service';
import { API_URL } from '../tokens/api-url.token';

describe('BlogService', () => {
  let service: BlogService;
  let httpMock: HttpTestingController;

  const mockPaginated = {
    data: [
      { id: 1, title: 'Post 1', slug: 'post-1', excerpt: 'Excerpt 1', content: 'Content 1', featured_image: null, status: 'published' as const, published_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      { id: 2, title: 'Post 2', slug: 'post-2', excerpt: 'Excerpt 2', content: 'Content 2', featured_image: null, status: 'draft' as const, published_at: null, created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
    ],
    current_page: 1,
    last_page: 3,
    per_page: 10,
    total: 25,
    from: 1,
    to: 2,
    prev_page_url: null,
    next_page_url: 'http://localhost/api/posts?page=2',
  };

  const mockCategories = [
    { id: 1, name: 'Tech', slug: 'tech', description: null, posts_count: 5 },
    { id: 2, name: 'Laravel', slug: 'laravel', description: 'Laravel posts', posts_count: 3 },
  ];

  const mockTags = [
    { id: 1, name: 'php', slug: 'php', posts_count: 4 },
    { id: 2, name: 'angular', slug: 'angular', posts_count: 2 },
  ];

  const mockPost = {
    id: 1, title: 'Test Post', slug: 'test-post', excerpt: 'Test excerpt', content: 'Test content',
    featured_image: null, status: 'published' as const, published_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  };

  const mockComment = { id: 10, content: 'Great post!', parent_id: null, is_approved: true, created_at: '2026-01-01T00:00:00Z', user: { id: 1, name: 'Jane', username: 'jane', avatar_url: null, bio: null, created_at: '2026-01-01T00:00:00Z' } };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(BlogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPosts', () => {
    it('should GET posts with page param', fakeAsync(() => {
      service.getPosts(2).subscribe(res => {
        expect(res).toEqual(mockPaginated);
      });

      const req = httpMock.expectOne('/api/posts?page=2');
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginated);
      tick();
    }));

    it('should include search filter', fakeAsync(() => {
      service.getPosts(1, { search: 'angular' }).subscribe();

      const req = httpMock.expectOne('/api/posts?page=1&search=angular');
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginated);
      tick();
    }));

    it('should include category filter', fakeAsync(() => {
      service.getPosts(1, { category: 'tech' }).subscribe(res => {
        expect(res).toEqual(mockPaginated);
      });

      const req = httpMock.expectOne('/api/posts?page=1&category=tech');
      req.flush(mockPaginated);
      tick();
    }));

    it('should include tag filter', fakeAsync(() => {
      service.getPosts(1, { tag: 'php' }).subscribe(res => {
        expect(res).toEqual(mockPaginated);
      });

      const req = httpMock.expectOne('/api/posts?page=1&tag=php');
      req.flush(mockPaginated);
      tick();
    }));

    it('should include all filters', fakeAsync(() => {
      service.getPosts(3, { search: 'test', category: 'tech', tag: 'php' }).subscribe(res => {
        expect(res).toEqual(mockPaginated);
      });

      const req = httpMock.expectOne('/api/posts?page=3&search=test&category=tech&tag=php');
      req.flush(mockPaginated);
      tick();
    }));
  });

  describe('getPost', () => {
    it('should GET post by slug and unwrap data', fakeAsync(() => {
      service.getPost('test-post').subscribe(post => {
        expect(post).toEqual(mockPost);
      });

      const req = httpMock.expectOne('/api/posts/test-post');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPost });
      tick();
    }));
  });

  describe('getCategories', () => {
    it('should GET categories and unwrap data', fakeAsync(() => {
      service.getCategories().subscribe(cats => {
        expect(cats).toEqual(mockCategories);
      });

      const req = httpMock.expectOne('/api/categories');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockCategories });
      tick();
    }));
  });

  describe('getTags', () => {
    it('should GET tags and unwrap data', fakeAsync(() => {
      service.getTags().subscribe(tags => {
        expect(tags).toEqual(mockTags);
      });

      const req = httpMock.expectOne('/api/tags');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockTags });
      tick();
    }));
  });

  describe('getPostsByCategory', () => {
    it('should call getPosts with category filter', fakeAsync(() => {
      service.getPostsByCategory('tech', 2).subscribe(res => {
        expect(res).toEqual(mockPaginated);
      });

      const req = httpMock.expectOne('/api/posts?page=2&category=tech');
      req.flush(mockPaginated);
      tick();
    }));
  });

  describe('getPostsByTag', () => {
    it('should call getPosts with tag filter', fakeAsync(() => {
      service.getPostsByTag('php', 1).subscribe(res => {
        expect(res).toEqual(mockPaginated);
      });

      const req = httpMock.expectOne('/api/posts?page=1&tag=php');
      req.flush(mockPaginated);
      tick();
    }));
  });

  describe('createPost', () => {
    it('should POST new post', fakeAsync(() => {
      const payload = { title: 'New Post', content: 'Content', status: 'draft' };
      service.createPost(payload).subscribe(res => {
        expect(res.message).toBe('Post created');
        expect(res.post.title).toBe('New Post');
      });

      const req = httpMock.expectOne('/api/posts');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ message: 'Post created', post: { ...mockPost, title: 'New Post' } });
      tick();
    }));
  });

  describe('updatePost', () => {
    it('should PUT updated post', fakeAsync(() => {
      const payload = { title: 'Updated Title' };
      service.updatePost(1, payload).subscribe(res => {
        expect(res.message).toBe('Post updated');
      });

      const req = httpMock.expectOne('/api/posts/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ message: 'Post updated', post: mockPost });
      tick();
    }));
  });

  describe('deletePost', () => {
    it('should DELETE post by id', fakeAsync(() => {
      service.deletePost(1).subscribe(res => {
        expect(res.message).toBe('Post deleted');
      });

      const req = httpMock.expectOne('/api/posts/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Post deleted' });
      tick();
    }));
  });

  describe('addComment', () => {
    it('should POST comment without parent_id', fakeAsync(() => {
      service.addComment(1, 'Nice post!').subscribe(res => {
        expect(res.message).toBe('Comment added');
      });

      const req = httpMock.expectOne('/api/posts/1/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ content: 'Nice post!', parent_id: undefined });
      req.flush({ message: 'Comment added', comment: mockComment });
      tick();
    }));

    it('should POST comment with parent_id', fakeAsync(() => {
      service.addComment(1, 'Reply!', 5).subscribe();

      const req = httpMock.expectOne('/api/posts/1/comments');
      expect(req.request.body).toEqual({ content: 'Reply!', parent_id: 5 });
      req.flush({ message: 'Comment added', comment: mockComment });
      tick();
    }));
  });

  describe('deleteComment', () => {
    it('should DELETE comment by id', fakeAsync(() => {
      service.deleteComment(10).subscribe();

      const req = httpMock.expectOne('/api/comments/10');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Comment deleted' });
      tick();
    }));
  });
});
