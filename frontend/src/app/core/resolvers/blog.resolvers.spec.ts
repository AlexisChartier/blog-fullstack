import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, UrlSegment } from '@angular/router';
import { postsResolver, categoriesResolver, tagsResolver, postResolver, profileResolver } from './blog.resolvers';
import { BlogService } from '../services/blog.service';
import { UserService } from '../services/user.service';
import { API_URL } from '../tokens/api-url.token';

function createRouteSnapshot(params: Record<string, string> = {}, urlSegments: string[] = [], queryParams: Record<string, string> = {}): ActivatedRouteSnapshot {
  return {
    paramMap: {
      get: (key: string) => params[key] ?? null,
    },
    queryParams,
    url: urlSegments.map(seg => new UrlSegment(seg, {})),
  } as unknown as ActivatedRouteSnapshot;
}

const emptyPaginated = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: null, to: null, prev_page_url: null, next_page_url: null };

describe('blog.resolvers', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        UserService,
        { provide: API_URL, useValue: '/api' },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('postsResolver', () => {
    it('should resolve posts with page param', () => {
      const route = createRouteSnapshot({}, [], { page: '2' });
      let resolved = false;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe(() => { resolved = true; });
      });
      const req = httpMock.expectOne('/api/posts?page=2');
      req.flush(emptyPaginated);
      expect(resolved).toBe(true);
    });

    it('should default to page 1 when no page param', () => {
      const route = createRouteSnapshot({}, [], {});
      let resolved = false;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe(() => { resolved = true; });
      });
      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush(emptyPaginated);
      expect(resolved).toBe(true);
    });

    it('should include search filter from query params', () => {
      const route = createRouteSnapshot({}, [], { search: 'angular' });
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts?page=1&search=angular');
      req.flush(emptyPaginated);
      expect(result).toEqual(emptyPaginated);
    });

    it('should include category filter from URL param', () => {
      const route = createRouteSnapshot({ slug: 'tech' }, ['category'], {});
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts?page=1&category=tech');
      req.flush(emptyPaginated);
      expect(result).toEqual(emptyPaginated);
    });

    it('should include tag filter from URL param', () => {
      const route = createRouteSnapshot({ slug: 'php' }, ['tag'], {});
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts?page=1&tag=php');
      req.flush(emptyPaginated);
      expect(result).toEqual(emptyPaginated);
    });

    it('should not set category/tag when slug is from a different context', () => {
      const route = createRouteSnapshot({ slug: 'tech' }, ['something'], {});
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts?page=1');
      req.flush(emptyPaginated);
      expect(result).toEqual(emptyPaginated);
    });

    it('should combine search and page params', () => {
      const route = createRouteSnapshot({}, [], { search: 'test', page: '3' });
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts?page=3&search=test');
      req.flush(emptyPaginated);
      expect(result).toEqual(emptyPaginated);
    });

    it('should combine category filter and page param', () => {
      const route = createRouteSnapshot({ slug: 'tech' }, ['category'], { page: '2' });
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts?page=2&category=tech');
      req.flush(emptyPaginated);
      expect(result).toEqual(emptyPaginated);
    });

    it('should combine tag filter and page param', () => {
      const route = createRouteSnapshot({ slug: 'php' }, ['tag'], { page: '5' });
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts?page=5&tag=php');
      req.flush(emptyPaginated);
      expect(result).toEqual(emptyPaginated);
    });

    it('should prioritize search over slug when both present', () => {
      const route = createRouteSnapshot({ slug: 'tech' }, ['category'], { search: 'override' });
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postsResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts?page=1&search=override&category=tech');
      req.flush(emptyPaginated);
      expect(result).toEqual(emptyPaginated);
    });
  });

  describe('categoriesResolver', () => {
    it('should resolve categories', () => {
      let result: any;
      TestBed.runInInjectionContext(() => {
        (categoriesResolver({} as any, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/categories');
      req.flush({ data: [{ id: 1, name: 'Tech', slug: 'tech', description: null }] });
      expect(result).toEqual([{ id: 1, name: 'Tech', slug: 'tech', description: null }]);
    });
  });

  describe('tagsResolver', () => {
    it('should resolve tags', () => {
      let result: any;
      TestBed.runInInjectionContext(() => {
        (tagsResolver({} as any, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/tags');
      req.flush({ data: [{ id: 1, name: 'php', slug: 'php' }] });
      expect(result).toEqual([{ id: 1, name: 'php', slug: 'php' }]);
    });
  });

  describe('postResolver', () => {
    it('should resolve post by slug', () => {
      const route = createRouteSnapshot({ slug: 'test-post' });
      let result: any;
      TestBed.runInInjectionContext(() => {
        (postResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/posts/test-post');
      const mockPost = { id: 1, title: 'Test', slug: 'test-post', excerpt: '', content: '', featured_image: null, status: 'published', published_at: null, created_at: '', updated_at: '' };
      req.flush({ data: mockPost });
      expect(result).toEqual(mockPost);
    });

    it('should throw when slug is missing', () => {
      const route = createRouteSnapshot({});
      expect(() => TestBed.runInInjectionContext(() => postResolver(route, {} as any))).toThrowError('Slug required');
    });
  });

  describe('profileResolver', () => {
    it('should resolve user by username', () => {
      const route = createRouteSnapshot({ username: 'jane' });
      let result: any;
      TestBed.runInInjectionContext(() => {
        (profileResolver(route, {} as any) as any).subscribe((r: any) => { result = r; });
      });
      const req = httpMock.expectOne('/api/users/jane');
      const mockUser = { id: 1, name: 'Jane', username: 'jane', avatar_url: null, bio: null, created_at: '' };
      req.flush({ data: mockUser });
      expect(result).toEqual(mockUser);
    });

    it('should throw when username is missing', () => {
      const route = createRouteSnapshot({});
      expect(() => TestBed.runInInjectionContext(() => profileResolver(route, {} as any))).toThrowError('Username required');
    });
  });
});
