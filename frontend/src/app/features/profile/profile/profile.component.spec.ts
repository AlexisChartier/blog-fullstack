import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProfileComponent } from './profile.component';
import { UserService } from '../../../core/services/user.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { ActivatedRoute, Router, Data } from '@angular/router';
import { User, Post } from '../../../core/models';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser: User = {
    id: 1, name: 'Jane Doe', username: 'jane_doe', avatar_url: null, bio: 'Developer',
    roles: ['author'], created_at: '2026-01-01T00:00:00Z',
  };

  const mockPosts: Post[] = [
    { id: 1, title: 'Post 1', slug: 'post-1', excerpt: 'E1', content: 'C1', featured_image: null, status: 'published', published_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 2, title: 'Post 2', slug: 'post-2', excerpt: 'E2', content: 'C2', featured_image: null, status: 'draft', published_at: null, created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
  ];

  const mockUserWithPosts: User = { ...mockUser, posts: mockPosts };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService,
        { provide: API_URL, useValue: '/api' },
        {
          provide: ActivatedRoute,
          useValue: {
            data: { subscribe: (cb: (d: Data) => void) => cb({ user: mockUserWithPosts } as Data) },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(ProfileComponent);
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

  it('should start with loading true before route data', () => {
    const f = TestBed.createComponent(ProfileComponent);
    expect(f.componentInstance.loading()).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should load user and posts from route data', () => {
      expect(component.user()).toEqual(mockUserWithPosts);
      expect(component.posts()).toEqual(mockPosts);
      expect(component.loading()).toBe(false);
    });
  });

  describe('loadProfile', () => {
    it('should fetch user profile and set posts', fakeAsync(() => {
      component.loadProfile('jane_doe');

      const req = httpMock.expectOne('/api/users/jane_doe');
      req.flush({ data: mockUserWithPosts });
      tick();

      expect(component.user()).toEqual(mockUserWithPosts);
      expect(component.posts()).toEqual(mockPosts);
      expect(component.loading()).toBe(false);
    }));

    it('should set loading false on error', fakeAsync(() => {
      component.loadProfile('unknown');

      const req = httpMock.expectOne('/api/users/unknown');
      req.flush({}, { status: 404, statusText: 'Not Found' });
      tick();

      expect(component.loading()).toBe(false);
    }));

    it('should handle user with no posts', fakeAsync(() => {
      const userNoPosts = { ...mockUser, posts: undefined };
      component.loadProfile('jane_doe');

      const req = httpMock.expectOne('/api/users/jane_doe');
      req.flush({ data: userNoPosts });
      tick();

      expect(component.posts()).toEqual([]);
    }));
  });

  describe('template rendering', () => {
    it('should render user name', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Jane Doe');
    });

    it('should render username with @', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('@jane_doe');
    });

    it('should render bio', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Developer');
    });

    it('should render role badges', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('author');
    });

    it('should render recent posts', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Post 1');
      expect(el.textContent).toContain('Post 2');
    });

    it('should render "No posts yet" when user has no posts', () => {
      component.posts.set([]);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No posts yet.');
    });

    it('should render skeleton when loading', () => {
      component.loading.set(true);
      component.user.set(null);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    });
  });
});
