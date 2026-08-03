import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { API_URL } from '../tokens/api-url.token';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser = {
    id: 1, name: 'Jane Doe', username: 'jane_doe', email: 'jane@example.com',
    avatar_url: null, bio: 'Developer', roles: ['author'], created_at: '2026-01-01T00:00:00Z',
  };

  const mockPosts = [
    { id: 1, title: 'Post 1', slug: 'post-1', excerpt: 'E1', content: 'C1', featured_image: null, status: 'published' as const, published_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile', () => {
    it('should GET user by username and unwrap data', fakeAsync(() => {
      service.getProfile('jane_doe').subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('/api/users/jane_doe');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockUser });
      tick();
    }));
  });

  describe('getUserPosts', () => {
    it('should GET user posts with default page=1', fakeAsync(() => {
      service.getUserPosts('jane_doe').subscribe(res => {
        expect(res.data).toEqual(mockPosts);
        expect(res.current_page).toBe(1);
      });

      const req = httpMock.expectOne('/api/users/jane_doe/posts?page=1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPosts, current_page: 1, last_page: 1, total: 1 });
      tick();
    }));

    it('should GET user posts with custom page', fakeAsync(() => {
      service.getUserPosts('jane_doe', 3).subscribe(res => {
        expect(res.current_page).toBe(3);
      });

      const req = httpMock.expectOne('/api/users/jane_doe/posts?page=3');
      req.flush({ data: [], current_page: 3, last_page: 5, total: 50 });
      tick();
    }));
  });

  describe('updateProfile', () => {
    it('should PUT profile with FormData', fakeAsync(() => {
      const formData = new FormData();
      formData.append('name', 'Updated Name');

      service.updateProfile(formData).subscribe(res => {
        expect(res.message).toBe('Profile updated');
        expect(res.user.name).toBe('Updated Name');
      });

      const req = httpMock.expectOne('/api/profile');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBe(formData);
      req.flush({ message: 'Profile updated', user: { ...mockUser, name: 'Updated Name' } });
      tick();
    }));
  });
});
