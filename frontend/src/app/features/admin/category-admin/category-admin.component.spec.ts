import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CategoryAdminComponent } from './category-admin.component';
import { BlogService } from '../../../core/services/blog.service';
import { API_URL } from '../../../core/tokens/api-url.token';

describe('CategoryAdminComponent', () => {
  let component: CategoryAdminComponent;
  let fixture: ComponentFixture<CategoryAdminComponent>;
  let httpMock: HttpTestingController;

  const mockCategories = [
    { id: 1, name: 'Tech', slug: 'tech', description: null, posts_count: 5 },
    { id: 2, name: 'Laravel', slug: 'laravel', description: 'Laravel posts', posts_count: 3 },
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

    fixture = TestBed.createComponent(CategoryAdminComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne('/api/categories').flush({ data: mockCategories });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading true', () => {
    const f = TestBed.createComponent(CategoryAdminComponent);
    expect(f.componentInstance.loading()).toBe(true);
  });

  it('should start with form hidden', () => {
    expect(component.showForm()).toBe(false);
  });

  it('should load categories on init', () => {
    expect(component.categories()).toEqual(mockCategories);
    expect(component.loading()).toBe(false);
  });

  describe('startCreate', () => {
    it('should show form with empty fields', () => {
      component.name.set('old');
      component.description.set('old desc');
      component.startCreate();
      expect(component.showForm()).toBe(true);
      expect(component.editingId()).toBeNull();
      expect(component.name()).toBe('');
      expect(component.description()).toBe('');
    });
  });

  describe('startEdit', () => {
    it('should show form with category data', () => {
      component.startEdit(mockCategories[1]);
      expect(component.showForm()).toBe(true);
      expect(component.editingId()).toBe(2);
      expect(component.name()).toBe('Laravel');
      expect(component.description()).toBe('Laravel posts');
    });
  });

  describe('cancelForm', () => {
    it('should hide form and reset fields', () => {
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
    it('should POST new category', fakeAsync(() => {
      component.name.set('New Cat');
      component.description.set('Description');

      component.submit();

      const req = httpMock.expectOne('/api/categories');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'New Cat', description: 'Description' });
      req.flush({ message: 'Category created', category: { id: 3, name: 'New Cat', slug: 'new-cat', description: 'Description' } });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.showForm()).toBe(false);

      const reloadReq = httpMock.expectOne('/api/categories');
      reloadReq.flush({ data: [...mockCategories, { id: 3, name: 'New Cat', slug: 'new-cat', description: 'Description', posts_count: 0 }] });
      tick();
    }));

    it('should send null description when empty', fakeAsync(() => {
      component.name.set('New Cat');
      component.description.set('');

      component.submit();

      const req = httpMock.expectOne('/api/categories');
      expect(req.request.body).toEqual({ name: 'New Cat', description: null });
      req.flush({ message: 'ok', category: {} });
      tick();

      const reloadReq = httpMock.expectOne('/api/categories');
      reloadReq.flush({ data: mockCategories });
      tick();
    }));

    it('should set error on failure', fakeAsync(() => {
      component.name.set('New Cat');

      component.submit();

      const req = httpMock.expectOne('/api/categories');
      req.flush({ message: 'Slug already taken' }, { status: 422, statusText: 'Unprocessable' });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.error()).toBe('Slug already taken');
    }));
  });

  describe('submit - update', () => {
    it('should PUT updated category', fakeAsync(() => {
      component.editingId.set(1);
      component.name.set('Updated Name');

      component.submit();

      const req = httpMock.expectOne('/api/categories/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: 'Updated Name', description: null });
      req.flush({ message: 'Category updated', category: { id: 1, name: 'Updated Name', slug: 'updated-name', description: null } });
      tick();

      const reloadReq = httpMock.expectOne('/api/categories');
      reloadReq.flush({ data: mockCategories });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.showForm()).toBe(false);
    }));
  });

  describe('deleteCategory', () => {
    it('should not delete when confirm is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteCategory(1);
      expect(component.categories()).toHaveSize(2);
      httpMock.expectNone('/api/categories/1');
    });

    it('should DELETE category when confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);

      component.deleteCategory(1);

      const req = httpMock.expectOne('/api/categories/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Category deleted' });
      tick();

      const reloadReq = httpMock.expectOne('/api/categories');
      reloadReq.flush({ data: mockCategories });
      tick();
    }));
  });

  describe('template rendering', () => {
    it('should render page title', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Categories');
    });

    it('should render New Category button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('New Category');
    });

    it('should render category names in table', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Tech');
      expect(el.textContent).toContain('Laravel');
    });

    it('should show form when startCreate is called', () => {
      component.startCreate();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[name="name"]')).toBeTruthy();
    });

    it('should render empty state when no categories', () => {
      component.categories.set([]);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No categories yet.');
    });
  });
});
