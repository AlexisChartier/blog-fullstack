import { Routes } from '@angular/router';
import { authGuard, authorGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/blog/post-list/post-list.component').then(m => m.PostListComponent),
  },
  {
    path: 'post/:slug',
    loadComponent: () => import('./features/blog/post-detail/post-detail.component').then(m => m.PostDetailComponent),
  },
  {
    path: 'category/:slug',
    loadComponent: () => import('./features/blog/post-list/post-list.component').then(m => m.PostListComponent),
  },
  {
    path: 'tag/:slug',
    loadComponent: () => import('./features/blog/post-list/post-list.component').then(m => m.PostListComponent),
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./features/profile/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'settings/profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile-edit/profile-edit.component').then(m => m.ProfileEditComponent),
  },
  {
    path: 'admin/posts',
    canActivate: [authorGuard],
    loadComponent: () => import('./features/admin/post-admin/post-admin.component').then(m => m.PostAdminComponent),
  },
  {
    path: 'admin/posts/new',
    canActivate: [authorGuard],
    loadComponent: () => import('./features/admin/post-form/post-form.component').then(m => m.PostFormComponent),
  },
  {
    path: 'admin/posts/:id/edit',
    canActivate: [authorGuard],
    loadComponent: () => import('./features/admin/post-form/post-form.component').then(m => m.PostFormComponent),
  },
];
