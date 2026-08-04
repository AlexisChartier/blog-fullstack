import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Category, Comment, Paginated, Post, Tag } from '../models';
import { API_URL } from '../tokens/api-url.token';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getPosts(page = 1, filters?: { search?: string; category?: string; tag?: string }) {
    let params = new HttpParams().set('page', page);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.tag) params = params.set('tag', filters.tag);

    return this.http.get<Paginated<Post>>(`${this.apiUrl}/posts`, { params });
  }

  getMyPosts(page = 1) {
    const params = new HttpParams().set('page', page);
    return this.http.get<Paginated<Post>>(`${this.apiUrl}/auth/my-posts`, { params });
  }

  getMyPost(id: number) {
    return this.http.get<{ data: Post }>(`${this.apiUrl}/auth/my-posts/${id}`).pipe(
      map(res => res.data),
    );
  }

  getPost(slug: string) {
    return this.http.get<{ data: Post }>(`${this.apiUrl}/posts/${slug}`).pipe(
      map(res => res.data),
    );
  }

  getCategories() {
    return this.http.get<{ data: Category[] }>(`${this.apiUrl}/categories`).pipe(
      map(res => res.data),
    );
  }

  getTags() {
    return this.http.get<{ data: Tag[] }>(`${this.apiUrl}/tags`).pipe(
      map(res => res.data),
    );
  }

  getPostsByCategory(slug: string, page = 1) {
    return this.getPosts(page, { category: slug });
  }

  getPostsByTag(slug: string, page = 1) {
    return this.getPosts(page, { tag: slug });
  }

  createPost(data: { title?: string; excerpt?: string; content?: string; status?: string; published_at?: string | null; featured_image?: string | null; categories?: number[]; tags?: number[] }) {
    return this.http.post<{ message: string; post: Post }>(`${this.apiUrl}/posts`, data);
  }

  updatePost(id: number, data: { title?: string; excerpt?: string; content?: string; status?: string; published_at?: string | null; featured_image?: string | null; categories?: number[]; tags?: number[] }) {
    return this.http.put<{ message: string; post: Post }>(`${this.apiUrl}/posts/${id}`, data);
  }

  deletePost(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/posts/${id}`);
  }

  createCategory(data: { name: string; description?: string | null; slug?: string }) {
    return this.http.post<{ message: string; category: Category }>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: number, data: { name?: string; description?: string | null; slug?: string }) {
    return this.http.put<{ message: string; category: Category }>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/categories/${id}`);
  }

  createTag(data: { name: string; slug?: string }) {
    return this.http.post<{ message: string; tag: Tag }>(`${this.apiUrl}/tags`, data);
  }

  updateTag(id: number, data: { name?: string; slug?: string }) {
    return this.http.put<{ message: string; tag: Tag }>(`${this.apiUrl}/tags/${id}`, data);
  }

  deleteTag(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tags/${id}`);
  }

  getComments(page = 1) {
    const params = new HttpParams().set('page', page);
    return this.http.get<Paginated<Comment>>(`${this.apiUrl}/comments`, { params });
  }

  updateComment(id: number, data: { is_approved: boolean }) {
    return this.http.put<{ message: string; comment: Comment }>(`${this.apiUrl}/comments/${id}`, data);
  }

  addComment(postId: number, content: string, parentId?: number) {
    return this.http.post<{ message: string; comment: Comment }>(
      `${this.apiUrl}/posts/${postId}/comments`,
      { content, parent_id: parentId },
    );
  }

  deleteComment(id: number) {
    return this.http.delete(`${this.apiUrl}/comments/${id}`);
  }
}
