import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, Data } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { User, Post } from '../../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  user = signal<User | null>(null);
  posts = signal<Post[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.route.data.subscribe((data: Data) => {
      if (data['user']) {
        const user = data['user'] as User;
        this.user.set(user);
        this.posts.set(user.posts ?? []);
        this.loading.set(false);
      }
    });
  }

  loadProfile(username: string) {
    this.loading.set(true);
    this.userService.getProfile(username).subscribe({
      next: (user) => {
        this.user.set(user);
        this.posts.set(user.posts ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
