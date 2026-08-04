import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProfileEditComponent } from './profile-edit.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { API_URL } from '../../../core/tokens/api-url.token';
import { signal, WritableSignal } from '@angular/core';
import { User } from '../../../core/models';

describe('ProfileEditComponent', () => {
  let component: ProfileEditComponent;
  let fixture: ComponentFixture<ProfileEditComponent>;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;
  let userSignal: WritableSignal<User | null>;

  const mockUser: User = {
    id: 1, name: 'Jane Doe', username: 'jane_doe', email: 'jane@example.com',
    avatar_url: null, bio: 'Developer', roles: ['author'], created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    userSignal = signal(mockUser);

    authSpy = jasmine.createSpyObj('AuthService', ['fetchUser'], {
      user: userSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [ProfileEditComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService,
        { provide: AuthService, useValue: authSpy },
        { provide: API_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditComponent);
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

  it('should initialize fields from auth user', () => {
    expect(component.name()).toBe('Jane Doe');
    expect(component.username()).toBe('jane_doe');
    expect(component.bio()).toBe('Developer');
  });

  it('should start with empty signals for saving/success/error', () => {
    expect(component.saving()).toBe(false);
    expect(component.success()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('should initialize avatarUrl from user', () => {
    expect(component.avatarUrl()).toBeNull();
  });

  it('should start with no selected file', () => {
    expect(component.selectedFile()).toBeNull();
  });

  describe('onFileSelected', () => {
    it('should set selectedFile when a file is chosen', () => {
      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [file], writable: false });

      component.onFileSelected({ target: input } as unknown as Event);

      expect(component.selectedFile()).toBe(file);
    });

    it('should not set selectedFile when no file is chosen', () => {
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [], writable: false });

      component.onFileSelected({ target: input } as unknown as Event);

      expect(component.selectedFile()).toBeNull();
    });
  });

  it('should handle null user on init', () => {
    userSignal.set(null);
    const f = TestBed.createComponent(ProfileEditComponent);
    const c = f.componentInstance;
    f.detectChanges();
    expect(c.name()).toBe('');
    expect(c.username()).toBe('');
    expect(c.bio()).toBe('');
  });

  describe('submit', () => {
    it('should send FormData and show success on ok', fakeAsync(() => {
      component.name.set('Updated Name');
      component.username.set('new_username');
      component.bio.set('New bio');

      component.submit();

      const req = httpMock.expectOne('/api/profile');
      expect(req.request.method).toBe('PUT');
      const body = req.request.body as FormData;
      expect(body.get('name')).toBe('Updated Name');
      expect(body.get('username')).toBe('new_username');
      expect(body.get('bio')).toBe('New bio');
      req.flush({ message: 'Profile updated', user: { ...mockUser, name: 'Updated Name' } });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.success()).toBe(true);
      expect(component.error()).toBe('');
      expect(authSpy.fetchUser).toHaveBeenCalled();
    }));

    it('should show error on failure', fakeAsync(() => {
      component.submit();

      const req = httpMock.expectOne('/api/profile');
      req.flush({ message: 'Username already taken' }, { status: 422, statusText: 'Unprocessable' });
      tick();

      expect(component.saving()).toBe(false);
      expect(component.success()).toBe(false);
      expect(component.error()).toBe('Username already taken');
    }));

    it('should show generic error when no message in response', fakeAsync(() => {
      component.submit();

      const req = httpMock.expectOne('/api/profile');
      req.flush({}, { status: 500, statusText: 'Server Error' });
      tick();

      expect(component.error()).toBe('An error occurred.');
    }));

    it('should set saving true during request', () => {
      component.submit();
      expect(component.saving()).toBe(true);

      const req = httpMock.expectOne('/api/profile');
      req.flush({ message: 'ok' });
    });

    it('should include avatar in FormData when file is selected', fakeAsync(() => {
      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
      component.selectedFile.set(file);

      component.submit();

      const req = httpMock.expectOne('/api/profile');
      expect(req.request.method).toBe('PUT');
      const body = req.request.body as FormData;
      expect(body.get('avatar')).toBe(file);
      req.flush({ message: 'ok' });
      tick();

      expect(component.selectedFile()).toBeNull();
    }));

    it('should clear success and error on new submit', fakeAsync(() => {
      component.success.set(true);
      component.error.set('Old error');

      component.submit();

      expect(component.success()).toBe(false);
      expect(component.error()).toBe('');

      const req = httpMock.expectOne('/api/profile');
      req.flush({ message: 'ok' });
      tick();
    }));
  });

  describe('template rendering', () => {
    it('should render name input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[name="name"]')).toBeTruthy();
    });

    it('should render username input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[name="username"]')).toBeTruthy();
    });

    it('should render bio textarea', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('textarea[name="bio"]')).toBeTruthy();
    });

    it('should render Save Changes button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Save Changes');
    });

    it('should show success message when success signal is true', () => {
      component.success.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Profile updated successfully.');
    });

    it('should show error message when error signal is set', () => {
      component.error.set('Something went wrong');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Something went wrong');
    });

    it('should disable submit button when saving', () => {
      component.saving.set(true);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should show "Saving..." when saving', () => {
      component.saving.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Saving...');
    });
  });
});
