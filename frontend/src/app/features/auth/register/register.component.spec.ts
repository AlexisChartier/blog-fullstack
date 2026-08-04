import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { signal, WritableSignal } from '@angular/core';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let loadingSignal: WritableSignal<boolean>;
  let errorSignal: WritableSignal<string | null>;

  beforeEach(async () => {
    loadingSignal = signal(false);
    errorSignal = signal(null);
    authSpy = jasmine.createSpyObj('AuthService', ['register'], {
      loading: loadingSignal.asReadonly(),
      error: errorSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, FormsModule, NgIf, RouterLink, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty fields', () => {
    expect(component.name()).toBe('');
    expect(component.username()).toBe('');
    expect(component.email()).toBe('');
    expect(component.password()).toBe('');
    expect(component.passwordConfirmation()).toBe('');
  });

  it('should start with no error', () => {
    expect(component.error).toBe('');
  });

  it('should expose loading signal from auth service', () => {
    expect(component.loading()).toBe(false);
  });

  describe('submit', () => {
    it('should set error when passwords do not match', () => {
      component.name.set('Jane');
      component.username.set('jane');
      component.email.set('jane@example.com');
      component.password.set('Password123!');
      component.passwordConfirmation.set('DifferentPassword!');
      component.submit();

      expect(component.error).toBe('Passwords do not match.');
      expect(authSpy.register).not.toHaveBeenCalled();
    });

    it('should set error when fields are empty', () => {
      component.name.set('');
      component.username.set('');
      component.email.set('');
      component.password.set('');
      component.passwordConfirmation.set('');
      component.submit();

      expect(component.error).toBe('Please fill in all fields.');
      expect(authSpy.register).not.toHaveBeenCalled();
    });

    it('should set error when name is empty', () => {
      component.name.set('');
      component.username.set('jane');
      component.email.set('jane@example.com');
      component.password.set('Password123!');
      component.passwordConfirmation.set('Password123!');
      component.submit();

      expect(component.error).toBe('Please fill in all fields.');
      expect(authSpy.register).not.toHaveBeenCalled();
    });

    it('should set error when password is too short', () => {
      component.name.set('Jane');
      component.username.set('jane');
      component.email.set('jane@example.com');
      component.password.set('Short1!');
      component.passwordConfirmation.set('Short1!');
      component.submit();

      expect(component.error).toBe('Password must be at least 8 characters.');
      expect(authSpy.register).not.toHaveBeenCalled();
    });

    it('should clear previous local error on submit', () => {
      component.localError.set('Previous error');
      component.name.set('Jane');
      component.username.set('jane');
      component.email.set('jane@example.com');
      component.password.set('Password123!');
      component.passwordConfirmation.set('Password123!');
      component.submit();

      expect(component.localError()).toBe('');
    });

    it('should call auth.register with trimmed fields when valid', () => {
      component.name.set('  Jane Doe  ');
      component.username.set('  jane_doe  ');
      component.email.set('  jane@example.com  ');
      component.password.set('Password123!');
      component.passwordConfirmation.set('Password123!');
      component.submit();

      expect(authSpy.register).toHaveBeenCalledWith(
        'Jane Doe',
        'jane_doe',
        'jane@example.com',
        'Password123!',
      );
    });
  });

  describe('template rendering', () => {
    it('should render the register form', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('form')).toBeTruthy();
    });

    it('should render name input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[name="name"]')).toBeTruthy();
    });

    it('should render username input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[name="username"]')).toBeTruthy();
    });

    it('should render email input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[type="email"]')).toBeTruthy();
    });

    it('should render two password inputs', () => {
      const el: HTMLElement = fixture.nativeElement;
      const passwordInputs = el.querySelectorAll('input[type="password"]');
      expect(passwordInputs).toHaveSize(2);
    });

    it('should render submit button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should display error message when localError is set', () => {
      component.localError.set('Passwords do not match.');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Passwords do not match.');
    });

    it('should display server error when auth error is set', () => {
      errorSignal.set('Email already taken');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Email already taken');
    });

    it('should not display error message when error is empty', () => {
      component.localError.set('');
      errorSignal.set(null);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const errorBanner = el.querySelector('.bg-red-50');
      expect(errorBanner).toBeNull();
    });

    it('should show "Create account" text when not loading', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Create account');
    });

    it('should show "Creating..." text when loading', () => {
      loadingSignal.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Creating...');
    });

    it('should disable submit button when loading', () => {
      loadingSignal.set(true);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should render link to login page', () => {
      const el: HTMLElement = fixture.nativeElement;
      const link = el.querySelector('a[routerlink="/login"], a[ng-reflect-router-link="/login"]');
      expect(link).toBeTruthy();
    });
  });

  describe('user interaction', () => {
    it('should update name signal when typing in name field', () => {
      const input = fixture.nativeElement.querySelector('input[name="name"]') as HTMLInputElement;
      input.value = 'Jane Doe';
      input.dispatchEvent(new Event('input'));
      expect(component.name()).toBe('Jane Doe');
    });

    it('should update password signal when typing in password field', () => {
      const input = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;
      input.value = 'mypassword';
      input.dispatchEvent(new Event('input'));
      expect(component.password()).toBe('mypassword');
    });

    it('should update passwordConfirmation when typing in confirm field', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type="password"]');
      const confirmInput = inputs[1] as HTMLInputElement;
      confirmInput.value = 'confirm';
      confirmInput.dispatchEvent(new Event('input'));
      expect(component.passwordConfirmation()).toBe('confirm');
    });

    it('should call submit when form is submitted', () => {
      spyOn(component, 'submit');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      expect(component.submit).toHaveBeenCalled();
    });
  });
});
