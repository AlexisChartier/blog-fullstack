import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { signal, WritableSignal } from '@angular/core';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let userSignal: WritableSignal<any>;
  let isAuthenticatedSignal: WritableSignal<boolean>;

  beforeEach(async () => {
    localStorage.removeItem('darkMode');
    document.documentElement.classList.remove('dark');
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as any);
    userSignal = signal(null);
    isAuthenticatedSignal = signal(false);

    authSpy = jasmine.createSpyObj('AuthService', ['logout', 'hasRole'], {
      user: userSignal.asReadonly(),
      isAuthenticated: isAuthenticatedSignal.asReadonly(),
    });
    authSpy.hasRole.and.callFake((role: string) => {
      const user = userSignal();
      if (!user?.roles) return false;
      if (role === 'author') return user.roles.includes('admin') || user.roles.includes('author');
      return user.roles.includes(role);
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterLink, RouterLinkActive, RouterOutlet, NgIf, NgFor, FormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with dark mode off', () => {
    expect(component.darkMode()).toBe(false);
  });

  it('should start with menus closed', () => {
    expect(component.menuOpen()).toBe(false);
    expect(component.profileOpen()).toBe(false);
  });

  describe('dark mode', () => {
    it('should toggle dark mode on', () => {
      component.toggleDarkMode();
      fixture.detectChanges();
      expect(component.darkMode()).toBe(true);
    });

    it('should toggle dark mode off', () => {
      component.darkMode.set(true);
      component.toggleDarkMode();
      fixture.detectChanges();
      expect(component.darkMode()).toBe(false);
    });

    it('should initialize dark mode from localStorage when stored as true', () => {
      localStorage.setItem('darkMode', 'true');
      document.documentElement.classList.remove('dark');

      const f = TestBed.createComponent(AppComponent);
      f.detectChanges();

      expect(f.componentInstance.darkMode()).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should initialize dark mode from prefers-color-scheme when no localStorage value', () => {
      localStorage.removeItem('darkMode');
      (window.matchMedia as jasmine.Spy).and.returnValue({ matches: true } as any);
      document.documentElement.classList.remove('dark');

      const f = TestBed.createComponent(AppComponent);
      f.detectChanges();

      expect(f.componentInstance.darkMode()).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should not enable dark mode when localStorage is false and no prefers-color-scheme match', () => {
      localStorage.setItem('darkMode', 'false');
      (window.matchMedia as jasmine.Spy).and.returnValue({ matches: false } as any);

      const f = TestBed.createComponent(AppComponent);
      f.detectChanges();

      expect(f.componentInstance.darkMode()).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should remove dark class from document when dark mode is toggled off', () => {
      component.darkMode.set(true);
      document.documentElement.classList.add('dark');

      component.toggleDarkMode();
      fixture.detectChanges();

      expect(component.darkMode()).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should add dark class to document when dark mode is toggled on', () => {
      document.documentElement.classList.remove('dark');

      component.toggleDarkMode();
      fixture.detectChanges();

      expect(component.darkMode()).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('menu toggles', () => {
    it('should toggle menu', () => {
      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);
      component.toggleMenu();
      expect(component.menuOpen()).toBe(false);
    });

    it('should toggle profile', () => {
      component.toggleProfile();
      expect(component.profileOpen()).toBe(true);
      component.toggleProfile();
      expect(component.profileOpen()).toBe(false);
    });

    it('should close all menus', () => {
      component.menuOpen.set(true);
      component.profileOpen.set(true);
      component.closeMenus();
      expect(component.menuOpen()).toBe(false);
      expect(component.profileOpen()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call auth.logout and close menus', () => {
      component.menuOpen.set(true);
      component.profileOpen.set(true);
      component.logout();
      expect(authSpy.logout).toHaveBeenCalled();
      expect(component.menuOpen()).toBe(false);
      expect(component.profileOpen()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true when user has admin role', () => {
      userSignal.set({ id: 1, name: 'Admin', username: 'admin', avatar_url: null, bio: null, roles: ['admin'], created_at: '' });
      expect(component.isAdmin).toBe(true);
    });

    it('should return false when user does not have admin role', () => {
      userSignal.set({ id: 2, name: 'Reader', username: 'reader', avatar_url: null, bio: null, roles: ['reader'], created_at: '' });
      expect(component.isAdmin).toBe(false);
    });
  });

  describe('isAuthor', () => {
    it('should return true when user has author role', () => {
      userSignal.set({ id: 3, name: 'Author', username: 'author', avatar_url: null, bio: null, roles: ['author'], created_at: '' });
      expect(component.isAuthor).toBe(true);
    });

    it('should return true when user has admin role (admin implies author)', () => {
      userSignal.set({ id: 1, name: 'Admin', username: 'admin', avatar_url: null, bio: null, roles: ['admin'], created_at: '' });
      expect(component.isAuthor).toBe(true);
    });

    it('should return false when user is only reader', () => {
      userSignal.set({ id: 2, name: 'Reader', username: 'reader', avatar_url: null, bio: null, roles: ['reader'], created_at: '' });
      expect(component.isAuthor).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('should show DevBlog brand text', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('DevBlog');
    });

    it('should show Login link when unauthenticated', () => {
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Login');
    });

    it('should show Get Started button when unauthenticated', () => {
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Get Started');
    });

    it('should show user name when authenticated', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 1, name: 'Jane Doe', username: 'jane', avatar_url: null, bio: null, roles: ['reader'], created_at: '' });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Jane Doe');
    });

    it('should show Dashboard link when user is author', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 1, name: 'Author', username: 'author', avatar_url: null, bio: null, roles: ['author'], created_at: '' });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Dashboard');
    });

    it('should not show Dashboard link when user is not author', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 2, name: 'Reader', username: 'reader', avatar_url: null, bio: null, roles: ['reader'], created_at: '' });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).not.toContain('Dashboard');
    });

    it('should show Categories link when user is admin', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 1, name: 'Admin', username: 'admin', avatar_url: null, bio: null, roles: ['admin'], created_at: '' });
      component.profileOpen.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Categories');
    });

    it('should show Tags link when user is admin', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 1, name: 'Admin', username: 'admin', avatar_url: null, bio: null, roles: ['admin'], created_at: '' });
      component.profileOpen.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Tags');
    });

    it('should show Comments link when user is admin', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 1, name: 'Admin', username: 'admin', avatar_url: null, bio: null, roles: ['admin'], created_at: '' });
      component.profileOpen.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Comments');
    });

    it('should not show Categories link when user is not admin', () => {
      isAuthenticatedSignal.set(true);
      userSignal.set({ id: 2, name: 'Author', username: 'author', avatar_url: null, bio: null, roles: ['author'], created_at: '' });
      component.profileOpen.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).not.toContain('Categories');
    });

    it('should have router-outlet', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('router-outlet')).toBeTruthy();
    });

    it('should render footer', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('footer')).toBeTruthy();
    });
  });
});
