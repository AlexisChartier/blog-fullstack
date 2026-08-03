import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) this.loadProfile(username);
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
