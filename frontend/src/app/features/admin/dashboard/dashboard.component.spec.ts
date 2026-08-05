import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminDashboardComponent } from './dashboard.component';
import { BlogService } from '../../../core/services/blog.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { AdminStats } from '../../../core/models';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let httpMock: HttpTestingController;

  const mockStats: AdminStats = {
    users: 10,
    posts: 45,
    published_posts: 40,
    draft_posts: 5,
    comments: 703,
    approved_comments: 673,
    pending_comments: 30,
    categories: 12,
    tags: 30,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: API_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne('/api/admin/stats').flush({ data: mockStats });
    expect(component).toBeTruthy();
  });

  it('should load stats on init', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/stats');
    req.flush({ data: mockStats });
    tick();

    expect(component.stats()).toEqual(mockStats);
    expect(component.loading()).toBe(false);
  }));

  it('should set loading false on error', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/stats');
    req.flush({}, { status: 403, statusText: 'Forbidden' });
    tick();

    expect(component.loading()).toBe(false);
  }));

  it('should render stat cards', fakeAsync(() => {
    const req = httpMock.expectOne('/api/admin/stats');
    req.flush({ data: mockStats });
    tick();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('10');
    expect(el.textContent).toContain('Users');
    expect(el.textContent).toContain('45');
    expect(el.textContent).toContain('30 pending');
  }));
});
