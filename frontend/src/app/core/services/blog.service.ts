import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Category, Comment, Paginated, Post, Tag } from '../models';
import { API_URL } from '../tokens/api-url.token';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  getPosts(page = 1, filters?: { search?: string; category?: string; tag?: string }) {
    let params = new HttpParams().set('page', page);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.tag) params = params.set('tag', filters.tag);

    return this.http.get<Paginated<Post>>(`${this.apiUrl}/posts`, { params });
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

  createPost(data: { title?: string; excerpt?: string; content?: string; status?: string; published_at?: string | null; featured_image?: string; categories?: number[]; tags?: number[] }) {
    return this.http.post<{ message: string; post: Post }>(`${this.apiUrl}/posts`, data);
  }

  updatePost(id: number, data: { title?: string; excerpt?: string; content?: string; status?: string; published_at?: string | null; featured_image?: string; categories?: number[]; tags?: number[] }) {
    return this.http.put<{ message: string; post: Post }>(`${this.apiUrl}/posts/${id}`, data);
  }

  deletePost(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/posts/${id}`);
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
