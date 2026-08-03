import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { signal, WritableSignal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let loadingSignal: WritableSignal<boolean>;

  beforeEach(async () => {
    loadingSignal = signal(false);
    authSpy = jasmine.createSpyObj('AuthService', ['login'], {
      loading: loadingSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule, NgIf, RouterLink, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty fields', () => {
    expect(component.email()).toBe('');
    expect(component.password()).toBe('');
  });

  it('should start with no error', () => {
    expect(component.error()).toBe('');
  });

  it('should expose loading signal from auth service', () => {
    expect(component.loading()).toBe(false);
  });

  describe('submit', () => {
    it('should set error when email is empty', () => {
      component.email.set('');
      component.password.set('password');
      component.submit();
      expect(component.error()).toBe('Please fill in all fields.');
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('should set error when password is empty', () => {
      component.email.set('test@example.com');
      component.password.set('');
      component.submit();
      expect(component.error()).toBe('Please fill in all fields.');
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('should set error when both fields are empty', () => {
      component.email.set('');
      component.password.set('');
      component.submit();
      expect(component.error()).toBe('Please fill in all fields.');
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('should clear previous error on submit', () => {
      component.error.set('Previous error');
      component.email.set('test@example.com');
      component.password.set('password');
      component.submit();
      expect(component.error()).toBe('');
    });

    it('should call auth.login with email and password when fields are filled', () => {
      component.email.set('test@example.com');
      component.password.set('Password123!');
      component.submit();
      expect(authSpy.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
    });
  });

  describe('template rendering', () => {
    it('should render the login form', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('form')).toBeTruthy();
    });

    it('should render email input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[type="email"]')).toBeTruthy();
    });

    it('should render password input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[type="password"]')).toBeTruthy();
    });

    it('should render submit button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should display error message when error signal is set', () => {
      component.error.set('Invalid credentials');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Invalid credentials');
    });

    it('should not display error message when error is empty', () => {
      component.error.set('');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const errorBanner = el.querySelector('.bg-red-50');
      expect(errorBanner).toBeNull();
    });

    it('should show "Sign in" text when not loading', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Sign in');
    });

    it('should show "Signing in..." text when loading', () => {
      loadingSignal.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Signing in...');
    });

    it('should disable submit button when loading', () => {
      loadingSignal.set(true);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should render demo accounts section', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Demo accounts');
      expect(el.textContent).toContain('admin@example.com');
      expect(el.textContent).toContain('jane@example.com');
      expect(el.textContent).toContain('reader@example.com');
    });

    it('should render link to register page', () => {
      const el: HTMLElement = fixture.nativeElement;
      const link = el.querySelector('a[routerlink="/register"], a[ng-reflect-router-link="/register"]');
      expect(link).toBeTruthy();
    });
  });

  describe('user interaction', () => {
    it('should update email signal when typing in email field', () => {
      const input = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
      input.value = 'test@example.com';
      input.dispatchEvent(new Event('input'));
      expect(component.email()).toBe('test@example.com');
    });

    it('should update password signal when typing in password field', () => {
      const input = fixture.nativeElement.querySelector('input[type="password"]') as HTMLInputElement;
      input.value = 'mypassword';
      input.dispatchEvent(new Event('input'));
      expect(component.password()).toBe('mypassword');
    });

    it('should call submit when form is submitted', () => {
      spyOn(component, 'submit');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      expect(component.submit).toHaveBeenCalled();
    });
  });
});
