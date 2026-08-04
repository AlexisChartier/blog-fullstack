import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TagAdminComponent } from './tag-admin.component';
import { BlogService } from '../../../core/services/blog.service';
import { API_URL } from '../../../core/tokens/api-url.token';

describe('TagAdminComponent', () => {
  let component: TagAdminComponent;
  let fixture: ComponentFixture<TagAdminComponent>;
  let httpMock: HttpTestingController;

  const mockTags = [
    { id: 1, name: 'php', slug: 'php', posts_count: 4 },
    { id: 2, name: 'angular', slug: 'angular', posts_count: 2 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BlogService,
        { provide: API_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TagAdminComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne('/api/tags').flush({ data: mockTags });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading true', () => {
    const f = TestBed.createComponent(TagAdminComponent);
    expect(f.componentInstance.loading()).toBe(true);
  });

  it('should load tags on init', () => {
    expect(component.tags()).toEqual(mockTags);
    expect(component.loading()).toBe(false);
  });

  describe('startCreate', () => {
    it('should show form with empty name', () => {
      component.name.set('old');
      component.startCreate();
      expect(component.showForm()).toBe(true);
      expect(component.editingId()).toBeNull();
      expect(component.name()).toBe('');
    });
  });

  describe('startEdit', () => {
    it('should show form with tag name', () => {
      component.startEdit(mockTags[1]);
      expect(component.showForm()).toBe(true);
      expect(component.editingId()).toBe(2);
      expect(component.name()).toBe('angular');
    });
  });

  describe('cancelForm', () => {
    it('should hide form and reset name', () => {
      component.showForm.set(true);
      component.editingId.set(1);
      component.name.set('Test');
      component.cancelForm();
      expect(component.showForm()).toBe(false);
      expect(component.editingId()).toBeNull();
      expect(component.name()).toBe('');
    });
  });

  describe('submit - create', () => {
    it('should POST new tag', fakeAsync(() => {
      component.name.set('New Tag');

      component.submit();

      const req = httpMock.expectOne('/api/tags');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'New Tag' });
      req.flush({ message: 'Tag created', tag: { id: 3, name: 'New Tag', slug: 'new-tag' } });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.showForm()).toBe(false);

      const reloadReq = httpMock.expectOne('/api/tags');
      reloadReq.flush({ data: [...mockTags, { id: 3, name: 'New Tag', slug: 'new-tag', posts_count: 0 }] });
      tick();
    }));

    it('should set error on failure', fakeAsync(() => {
      component.name.set('New Tag');

      component.submit();

      const req = httpMock.expectOne('/api/tags');
      req.flush({ message: 'Slug already taken' }, { status: 422, statusText: 'Unprocessable' });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.error()).toBe('Slug already taken');
    }));
  });

  describe('submit - update', () => {
    it('should PUT updated tag', fakeAsync(() => {
      component.editingId.set(1);
      component.name.set('Updated Tag');

      component.submit();

      const req = httpMock.expectOne('/api/tags/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: 'Updated Tag' });
      req.flush({ message: 'Tag updated', tag: { id: 1, name: 'Updated Tag', slug: 'updated-tag' } });
      tick();

      const reloadReq = httpMock.expectOne('/api/tags');
      reloadReq.flush({ data: mockTags });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.showForm()).toBe(false);
    }));
  });

  describe('deleteTag', () => {
    it('should not delete when confirm is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteTag(1);
      httpMock.expectNone('/api/tags/1');
    });

    it('should DELETE tag when confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);

      component.deleteTag(1);

      const req = httpMock.expectOne('/api/tags/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Tag deleted' });
      tick();

      const reloadReq = httpMock.expectOne('/api/tags');
      reloadReq.flush({ data: mockTags });
      tick();
    }));
  });

  describe('template rendering', () => {
    it('should render page title', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Tags');
    });

    it('should render New Tag button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('New Tag');
    });

    it('should render tag names', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('php');
      expect(el.textContent).toContain('angular');
    });

    it('should render empty state when no tags', () => {
      component.tags.set([]);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No tags yet.');
    });
  });
});
