import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../../core/services/blog.service';
import { Tag } from '../../../core/models';

@Component({
  selector: 'app-tag-admin',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './tag-admin.component.html',
})
export class TagAdminComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  tags = signal<Tag[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);

  name = signal('');

  ngOnInit() {
    this.loadTags();
  }

  loadTags() {
    this.loading.set(true);
    this.blogService.getTags().subscribe({
      next: (tags) => {
        this.tags.set(tags);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startCreate() {
    this.editingId.set(null);
    this.name.set('');
    this.showForm.set(true);
    this.error.set('');
  }

  startEdit(tag: Tag) {
    this.editingId.set(tag.id);
    this.name.set(tag.name);
    this.showForm.set(true);
    this.error.set('');
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.name.set('');
    this.error.set('');
  }

  submit() {
    this.saving.set(true);
    this.error.set('');

    const data = { name: this.name() };

    if (this.editingId() !== null) {
      this.blogService.updateTag(this.editingId()!, data).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelForm();
          this.loadTags();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'An error occurred.');
        },
      });
    } else {
      this.blogService.createTag(data).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelForm();
          this.loadTags();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'An error occurred.');
        },
      });
    }
  }

  deleteTag(id: number) {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    this.blogService.deleteTag(id).subscribe({
      next: () => this.loadTags(),
    });
  }
}
