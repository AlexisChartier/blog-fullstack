import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserAdminComponent } from './user-admin.component';
import { BlogService } from '../../../core/services/blog.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { User } from '../../../core/models';

describe('UserAdminComponent', () => {
  let component: UserAdminComponent;
  let fixture: ComponentFixture<UserAdminComponent>;
  let httpMock: HttpTestingController;

  const mockUsers: User[] = [
    { id: 1, name: 'Admin', username: 'admin', email: 'admin@example.com', avatar_url: null, bio: null, roles: ['admin'], posts_count: 0, comments_count: 0, created_at: '2026-01-01T00:00:00Z' },
    { id: 2, name: 'Author', username: 'author', email: 'author@example.com', avatar_url: null, bio: null, roles: ['author'], posts_count: 5, comments_count: 3, created_at: '2026-01-01T00:00:00Z' },
  ];

  const mockPaginated = {
    data: mockUsers,
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
      imports: [UserAdminComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: API_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAdminComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne('/api/admin/users?page=1').flush(mockPaginated);
    expect(component).toBeTruthy();
  });

  it('should load users on init', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/users?page=1');
    req.flush(mockPaginated);
    tick();

    expect(component.users()).toEqual(mockUsers);
    expect(component.loading()).toBe(false);
  }));

  it('should set loading false on error', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/users?page=1');
    req.flush({}, { status: 403, statusText: 'Forbidden' });
    tick();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Failed to load users');
  }));

  it('should change user role and reload', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/users?page=1');
    req.flush(mockPaginated);
    tick();

    component.changeRole(mockUsers[1], 'admin');

    const updateReq = httpMock.expectOne('/api/admin/users/2/role');
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({ role: 'admin' });
    updateReq.flush({ message: 'User role updated', user: mockUsers[1] });
    tick();

    const reloadReq = httpMock.expectOne('/api/admin/users?page=1');
    reloadReq.flush(mockPaginated);
    tick();
  }));

  it('should set error on role update failure', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/users?page=1');
    req.flush(mockPaginated);
    tick();

    component.changeRole(mockUsers[1], 'admin');

    const updateReq = httpMock.expectOne('/api/admin/users/2/role');
    updateReq.flush({ message: 'Cannot change own role' }, { status: 400, statusText: 'Bad Request' });
    tick();

    expect(component.error()).toBe('Cannot change own role');
  }));

  it('should load next page', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/users?page=1');
    req.flush({ ...mockPaginated, last_page: 3 });
    tick();

    component.nextPage();

    const req2 = httpMock.expectOne('/api/admin/users?page=2');
    req2.flush({ ...mockPaginated, data: [], current_page: 2 });
    tick();

    expect(component.currentPage()).toBe(2);
  }));

  it('should not go before page 1', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/users?page=1');
    req.flush(mockPaginated);
    tick();

    component.prevPage();
    expect(component.currentPage()).toBe(1);
    httpMock.expectNone('/api/admin/users?page=0');
  }));
});
