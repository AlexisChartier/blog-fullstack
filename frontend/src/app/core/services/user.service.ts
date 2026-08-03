import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Post, User } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getProfile(username: string) {
    return this.http.get<User>(`${this.apiUrl}/users/${username}`);
  }

  getUserPosts(username: string, page = 1) {
    return this.http.get<{ data: Post[]; current_page: number; last_page: number; total: number }>(
      `${this.apiUrl}/users/${username}/posts`,
      { params: { page } },
    );
  }

  updateProfile(data: FormData) {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/profile`, data);
  }
}
