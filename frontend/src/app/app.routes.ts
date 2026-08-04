import { Routes } from '@angular/router';
import { authGuard, authorGuard, adminGuard } from './core/guards/auth.guard';
import { postsResolver, categoriesResolver, tagsResolver, postResolver, profileResolver } from './core/resolvers/blog.resolvers';

export const routes: Routes = [
  {
    path: '',
    resolve: {
      posts: postsResolver,
      categories: categoriesResolver,
      tags: tagsResolver,
    },
    loadComponent: () => import('./features/blog/post-list/post-list.component').then(m => m.PostListComponent),
  },
  {
    path: 'post/:slug',
    resolve: {
      post: postResolver,
    },
    loadComponent: () => import('./features/blog/post-detail/post-detail.component').then(m => m.PostDetailComponent),
  },
  {
    path: 'category/:slug',
    resolve: {
      posts: postsResolver,
      categories: categoriesResolver,
      tags: tagsResolver,
    },
    loadComponent: () => import('./features/blog/post-list/post-list.component').then(m => m.PostListComponent),
  },
  {
    path: 'tag/:slug',
    resolve: {
      posts: postsResolver,
      categories: categoriesResolver,
      tags: tagsResolver,
    },
    loadComponent: () => import('./features/blog/post-list/post-list.component').then(m => m.PostListComponent),
  },
  {
    path: 'profile/:username',
    resolve: {
      user: profileResolver,
    },
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
  {
    path: 'admin/categories',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/category-admin/category-admin.component').then(m => m.CategoryAdminComponent),
  },
  {
    path: 'admin/tags',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/tag-admin/tag-admin.component').then(m => m.TagAdminComponent),
  },
  {
    path: 'admin/comments',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/comment-admin/comment-admin.component').then(m => m.CommentAdminComponent),
  },
  {
    path: '**',
    resolve: {
      posts: postsResolver,
      categories: categoriesResolver,
      tags: tagsResolver,
    },
    loadComponent: () => import('./features/blog/post-list/post-list.component').then(m => m.PostListComponent),
  },
];
