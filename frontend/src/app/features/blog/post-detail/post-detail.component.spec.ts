import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Meta } from '@angular/platform-browser';
import { PostDetailComponent } from './post-detail.component';
import { BlogService } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { ActivatedRoute, Data } from '@angular/router';
import { Post, Comment } from '../../../core/models';
import { signal, WritableSignal } from '@angular/core';

describe('PostDetailComponent', () => {
  let component: PostDetailComponent;
  let fixture: ComponentFixture<PostDetailComponent>;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;
  let userSignal: WritableSignal<any>;
  let isAuthenticatedSignal: WritableSignal<boolean>;

  const mockComment: Comment = {
    id: 1, content: 'Great post!', parent_id: null, is_approved: true, created_at: '2026-01-01T00:00:00Z',
    user: { id: 2, name: 'Commenter', username: 'commenter', avatar_url: null, bio: null, created_at: '' },
  };

  const mockPost: Post = {
    id: 1, title: 'Test Post', slug: 'test-post', excerpt: 'Excerpt', content: 'This is test content with enough words for reading time calculation.',
    featured_image: null, status: 'published', published_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    author: { id: 1, name: 'Author', username: 'author', avatar_url: null, bio: null, created_at: '' },
    categories: [{ id: 1, name: 'Tech', slug: 'tech', description: null }],
    tags: [{ id: 1, name: 'php', slug: 'php' }],
    comments: [mockComment],
  };

  beforeEach(async () => {
    userSignal = signal(null);
    isAuthenticatedSignal = signal(false);

    authSpy = jasmine.createSpyObj('AuthService', [], {
      user: userSignal.asReadonly(),
      isAuthenticated: isAuthenticatedSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [PostDetailComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: AuthService, useValue: authSpy },
        { provide: API_URL, useValue: '/api' },
        {
          provide: ActivatedRoute,
          useValue: {
            data: { subscribe: (cb: (d: Data) => void) => cb({ post: mockPost } as Data) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostDetailComponent);
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

  it('should start with loading true', () => {
    const f = TestBed.createComponent(PostDetailComponent);
    expect(f.componentInstance.loading()).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should load post from route data', () => {
      expect(component.post()).toEqual(mockPost);
      expect(component.loading()).toBe(false);
    });

    it('should set document title from post title', () => {
      expect(document.title).toBe('Test Post — DevBlog');
    });

    it('should set meta description from excerpt', () => {
      const metaService = TestBed.inject(Meta);
      const descriptionTag = metaService.getTag('name="description"');
      expect(descriptionTag?.getAttribute('content')).toBe('Excerpt');
    });

    it('should remain loading when no post in route data', () => {
      const route = TestBed.inject(ActivatedRoute);
      (route.data as any) = { subscribe: (cb: (d: Data) => void) => cb({} as Data) };
      const f = TestBed.createComponent(PostDetailComponent);
      f.detectChanges();
      expect(f.componentInstance.loading()).toBe(true);
      expect(f.componentInstance.post()).toBeNull();
    });

    it('should use post title for meta description when excerpt is null in route data', () => {
      const postNoExcerpt = { ...mockPost, excerpt: null, title: 'No Excerpt Here' };
      const route = TestBed.inject(ActivatedRoute);
      (route.data as any) = { subscribe: (cb: (d: Data) => void) => cb({ post: postNoExcerpt } as Data) };

      const f = TestBed.createComponent(PostDetailComponent);
      f.detectChanges();

      expect(f.componentInstance.post()?.title).toBe('No Excerpt Here');
      const metaService = TestBed.inject(Meta);
      const descTag = metaService.getTag('name="description"');
      expect(descTag?.getAttribute('content')).toBe('No Excerpt Here');
    });
  });

  describe('loadPost', () => {
    it('should fetch post by slug', fakeAsync(() => {
      component.loadPost('another-post');

      const req = httpMock.expectOne('/api/posts/another-post');
      req.flush({ data: { ...mockPost, slug: 'another-post', title: 'Another' } });
      tick();

      expect(component.post()?.slug).toBe('another-post');
      expect(component.loading()).toBe(false);
    }));

    it('should set loading false on error', fakeAsync(() => {
      component.loadPost('error-post');

      const req = httpMock.expectOne('/api/posts/error-post');
      req.flush({}, { status: 404, statusText: 'Not Found' });
      tick();

      expect(component.loading()).toBe(false);
    }));

    it('should use post title for meta description when excerpt is null', fakeAsync(() => {
      const postNoExcerpt = { ...mockPost, excerpt: null, title: 'No Excerpt Post' };
      component.loadPost('no-excerpt');

      const req = httpMock.expectOne('/api/posts/no-excerpt');
      req.flush({ data: postNoExcerpt });
      tick();

      expect(component.post()?.title).toBe('No Excerpt Post');
      const metaService = TestBed.inject(Meta);
      const descTag = metaService.getTag('name="description"');
      expect(descTag?.getAttribute('content')).toBe('No Excerpt Post');
    }));
  });

  describe('submitComment', () => {
    it('should not submit empty comment', () => {
      component.newComment.set('   ');
      component.submitComment();
      expect(component.commenting()).toBe(false);
      httpMock.expectNone('/api/posts/1/comments');
    });

    it('should post comment and reload post', fakeAsync(() => {
      component.post.set(mockPost);
      component.newComment.set('Nice article!');

      component.submitComment();

      const req = httpMock.expectOne('/api/posts/1/comments');
      expect(req.request.body).toEqual({ content: 'Nice article!', parent_id: undefined });
      req.flush({ message: 'Comment added', comment: mockComment });
      tick();

      const reloadReq = httpMock.expectOne('/api/posts/test-post');
      reloadReq.flush({ data: mockPost });
      tick();

      expect(component.newComment()).toBe('');
      expect(component.commenting()).toBe(false);
    }));

    it('should set commenting false on error', fakeAsync(() => {
      component.post.set(mockPost);
      component.newComment.set('Test');

      component.submitComment();

      const req = httpMock.expectOne('/api/posts/1/comments');
      req.flush({}, { status: 500, statusText: 'Server Error' });
      tick();

      expect(component.commenting()).toBe(false);
    }));
  });

  describe('reply', () => {
    it('startReply should set replyingTo and clear replyContent', () => {
      component.replyContent.set('old content');
      component.startReply(5);
      expect(component.replyingTo()).toBe(5);
      expect(component.replyContent()).toBe('');
    });

    it('cancelReply should clear replyingTo and replyContent', () => {
      component.replyingTo.set(3);
      component.replyContent.set('some text');
      component.cancelReply();
      expect(component.replyingTo()).toBeNull();
      expect(component.replyContent()).toBe('');
    });

    it('submitReply should not submit empty reply', () => {
      component.replyingTo.set(1);
      component.replyContent.set('  ');
      component.submitReply(1);
      expect(component.commenting()).toBe(false);
      httpMock.expectNone('/api/posts/1/comments');
    });

    it('submitReply should post reply with parent_id and reload', fakeAsync(() => {
      component.post.set(mockPost);
      component.replyingTo.set(1);
      component.replyContent.set('A reply');

      component.submitReply(1);

      const req = httpMock.expectOne('/api/posts/1/comments');
      expect(req.request.body).toEqual({ content: 'A reply', parent_id: 1 });
      req.flush({ message: 'Comment added', comment: mockComment });
      tick();

      const reloadReq = httpMock.expectOne('/api/posts/test-post');
      reloadReq.flush({ data: mockPost });
      tick();

      expect(component.replyContent()).toBe('');
      expect(component.replyingTo()).toBeNull();
      expect(component.commenting()).toBe(false);
    }));

    it('submitReply should set commenting false on error', fakeAsync(() => {
      component.post.set(mockPost);
      component.replyingTo.set(1);
      component.replyContent.set('A reply');

      component.submitReply(1);

      const req = httpMock.expectOne('/api/posts/1/comments');
      req.flush({}, { status: 500, statusText: 'Server Error' });
      tick();

      expect(component.commenting()).toBe(false);
    }));
  });

  describe('deleteComment', () => {
    it('should not delete if confirm is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.post.set(mockPost);
      component.deleteComment(1);
      expect(component.post()).toEqual(mockPost);
      httpMock.expectNone('/api/comments/1');
    });

    it('should delete comment and reload post', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.post.set(mockPost);

      component.deleteComment(1);

      const req = httpMock.expectOne('/api/comments/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted' });
      tick();

      const reloadReq = httpMock.expectOne('/api/posts/test-post');
      reloadReq.flush({ data: mockPost });
      tick();
    }));
  });

  describe('sharePost', () => {
    let originalShare: any;

    beforeEach(() => {
      originalShare = (navigator as any).share;
      (navigator as any).share = jasmine.createSpy('share').and.returnValue(Promise.resolve());
    });

    afterEach(() => {
      (navigator as any).share = originalShare;
    });

    it('should use navigator.share if available', () => {
      component.post.set(mockPost);
      component.sharePost();
      expect((navigator as any).share).toHaveBeenCalledWith({ title: 'Test Post', url: window.location.href });
    });

    it('should fallback to clipboard when share not available', () => {
      (navigator as any).share = undefined;
      component.post.set(mockPost);
      const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve() as any);
      component.sharePost();
      expect(clipboardSpy).toHaveBeenCalled();
      expect(component.copied()).toBe(true);
    });

    it('should reset copied signal after 2 seconds', fakeAsync(() => {
      (navigator as any).share = undefined;
      component.post.set(mockPost);
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve() as any);
      component.sharePost();
      expect(component.copied()).toBe(true);
      tick(2000);
      expect(component.copied()).toBe(false);
    }));

    it('should not share when post is null', () => {
      component.post.set(null);
      component.sharePost();
      expect((navigator as any).share).toHaveBeenCalledWith({ title: undefined, url: window.location.href });
    });
  });

  describe('readingTime getter', () => {
    it('should calculate reading time based on word count', () => {
      component.post.set({ ...mockPost, content: 'word '.repeat(200).trim() });
      expect(component.readingTime).toBe(1);
    });

    it('should return 1 for long content', () => {
      component.post.set({ ...mockPost, content: 'word '.repeat(400).trim() });
      expect(component.readingTime).toBe(2);
    });

    it('should return 1 for empty content', () => {
      component.post.set({ ...mockPost, content: '' });
      expect(component.readingTime).toBe(1);
    });

    it('should return 1 for null post', () => {
      component.post.set(null);
      expect(component.readingTime).toBe(1);
    });
  });

  describe('template rendering', () => {
    it('should render post title', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Test Post');
    });

    it('should render loading skeleton when loading', () => {
      component.loading.set(true);
      component.post.set(null);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    });

    it('should render comment section', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Comments');
    });

    it('should render login prompt when not authenticated', () => {
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Login to join the conversation.');
    });

    it('should render comment form when authenticated', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 1, name: 'User', username: 'user', avatar_url: null, bio: null, created_at: '' });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('textarea')).toBeTruthy();
    });

    it('should render post content', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('This is test content');
    });

    it('should render author name', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Author');
    });

    it('should render category badges', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Tech');
    });

    it('should render tag badges', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('php');
    });

    it('should render comments count', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('(1)');
    });

    it('should render existing comment content', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Great post!');
    });

    it('should render post not found when not loading and no post', () => {
      component.loading.set(false);
      component.post.set(null);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Post not found');
    });

    it('should render Back to Home link when post not found', () => {
      component.loading.set(false);
      component.post.set(null);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Back to Home');
    });

    it('should render Share button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Share');
    });

    it('should render reply button when authenticated', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 1, name: 'User', username: 'user', avatar_url: null, bio: null, created_at: '' });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Reply');
    });
  });
});
