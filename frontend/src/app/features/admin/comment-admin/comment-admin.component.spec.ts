import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CommentAdminComponent } from './comment-admin.component';
import { BlogService } from '../../../core/services/blog.service';
import { API_URL } from '../../../core/tokens/api-url.token';

describe('CommentAdminComponent', () => {
  let component: CommentAdminComponent;
  let fixture: ComponentFixture<CommentAdminComponent>;
  let httpMock: HttpTestingController;

  const mockComments = [
    {
      id: 1,
      content: 'Great post!',
      parent_id: null,
      is_approved: true,
      created_at: '2026-01-01T00:00:00Z',
      user: { id: 1, name: 'Jane', username: 'jane', avatar_url: null, bio: null, created_at: '' },
      post: { id: 1, title: 'Test Post', slug: 'test-post' },
    },
    {
      id: 2,
      content: 'Needs improvement',
      parent_id: null,
      is_approved: false,
      created_at: '2026-01-02T00:00:00Z',
      user: { id: 2, name: 'Bob', username: 'bob', avatar_url: null, bio: null, created_at: '' },
      post: { id: 1, title: 'Test Post', slug: 'test-post' },
    },
  ];

  const mockPaginated = {
    data: mockComments,
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 2,
    from: 1,
    to: 2,
    prev_page_url: null,
    next_page_url: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentAdminComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: API_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentAdminComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne('/api/comments?page=1').flush(mockPaginated);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading true', () => {
    const f = TestBed.createComponent(CommentAdminComponent);
    expect(f.componentInstance.loading()).toBe(true);
  });

  it('should load comments on init', () => {
    expect(component.comments()).toEqual(mockComments);
    expect(component.loading()).toBe(false);
  });

  describe('toggleApproval', () => {
    it('should approve an unapproved comment', fakeAsync(() => {
      component.comments.set([mockComments[1]]);

      component.toggleApproval(mockComments[1]);

      const req = httpMock.expectOne('/api/comments/2');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ is_approved: true });
      req.flush({ message: 'Comment updated', comment: { ...mockComments[1], is_approved: true } });
      tick();

      expect(component.comments()[0].is_approved).toBe(true);
    }));

    it('should unapprove an approved comment', fakeAsync(() => {
      component.comments.set([mockComments[0]]);

      component.toggleApproval(mockComments[0]);

      const req = httpMock.expectOne('/api/comments/1');
      expect(req.request.body).toEqual({ is_approved: false });
      req.flush({ message: 'Comment updated', comment: { ...mockComments[0], is_approved: false } });
      tick();

      expect(component.comments()[0].is_approved).toBe(false);
    }));
  });

  describe('deleteComment', () => {
    it('should not delete when confirm is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteComment(1);
      expect(component.comments()).toHaveSize(2);
      httpMock.expectNone('/api/comments/1');
    });

    it('should DELETE comment when confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.comments.set(mockComments);

      component.deleteComment(1);

      const req = httpMock.expectOne('/api/comments/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Comment deleted' });
      tick();

      const reloadReq = httpMock.expectOne('/api/comments?page=1');
      reloadReq.flush(mockPaginated);
      tick();
    }));
  });

  describe('pagination', () => {
    it('should go to next page', fakeAsync(() => {
      component.currentPage.set(1);
      component.lastPage.set(3);

      component.nextPage();

      const req = httpMock.expectOne('/api/comments?page=2');
      req.flush({ ...mockPaginated, current_page: 2 });
      tick();

      expect(component.currentPage()).toBe(2);
    }));

    it('should not go beyond last page', () => {
      component.currentPage.set(3);
      component.lastPage.set(3);
      component.nextPage();
      expect(component.currentPage()).toBe(3);
      httpMock.expectNone('/api/comments?page=4');
    });

    it('should go to prev page', fakeAsync(() => {
      component.currentPage.set(2);
      component.lastPage.set(3);

      component.prevPage();

      const req = httpMock.expectOne('/api/comments?page=1');
      req.flush({ ...mockPaginated, current_page: 1 });
      tick();

      expect(component.currentPage()).toBe(1);
    }));

    it('should not go before page 1', () => {
      component.currentPage.set(1);
      component.prevPage();
      expect(component.currentPage()).toBe(1);
      httpMock.expectNone('/api/comments?page=0');
    });
  });

  describe('template rendering', () => {
    it('should render page title', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Comments');
    });

    it('should render comment content', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Great post!');
    });

    it('should render user names', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Jane');
      expect(el.textContent).toContain('Bob');
    });

    it('should render approval status badges', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('approved');
      expect(el.textContent).toContain('pending');
    });

    it('should render Approve button for pending comments', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Approve');
      expect(el.textContent).toContain('Unapprove');
    });

    it('should render empty state when no comments', () => {
      component.comments.set([]);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No comments to moderate.');
    });
  });
});
