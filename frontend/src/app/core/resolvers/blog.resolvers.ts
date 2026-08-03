import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { UserService } from '../services/user.service';
import { Paginated, Post, Category, Tag, User } from '../models';

export const postsResolver: ResolveFn<Paginated<Post>> = (route) => {
  const blogService = inject(BlogService);
  const page = route.queryParams['page'] ? Number(route.queryParams['page']) : 1;
  const search = route.queryParams['search'];
  const categorySlug = route.paramMap.get('slug') && route.url[0]?.path === 'category' ? route.paramMap.get('slug') : null;
  const tagSlug = route.paramMap.get('slug') && route.url[0]?.path === 'tag' ? route.paramMap.get('slug') : null;

  const filters: { search?: string; category?: string; tag?: string } = {};
  if (search) filters.search = search;
  if (categorySlug) filters.category = categorySlug;
  if (tagSlug) filters.tag = tagSlug;

  return blogService.getPosts(page, filters);
};

export const categoriesResolver: ResolveFn<Category[]> = () => {
  return inject(BlogService).getCategories();
};

export const tagsResolver: ResolveFn<Tag[]> = () => {
  return inject(BlogService).getTags();
};

export const postResolver: ResolveFn<Post> = (route) => {
  const slug = route.paramMap.get('slug');
  if (!slug) throw new Error('Slug required');
  return inject(BlogService).getPost(slug);
};

export const profileResolver: ResolveFn<User> = (route) => {
  const username = route.paramMap.get('username');
  if (!username) throw new Error('Username required');
  return inject(UserService).getProfile(username);
};
