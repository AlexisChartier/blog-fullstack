import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../../core/services/blog.service';
import { Category } from '../../../core/models';

@Component({
  selector: 'app-category-admin',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './category-admin.component.html',
})
export class CategoryAdminComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  categories = signal<Category[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);

  name = signal('');
  description = signal('');

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.blogService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startCreate() {
    this.editingId.set(null);
    this.name.set('');
    this.description.set('');
    this.showForm.set(true);
    this.error.set('');
  }

  startEdit(cat: Category) {
    this.editingId.set(cat.id);
    this.name.set(cat.name);
    this.description.set(cat.description ?? '');
    this.showForm.set(true);
    this.error.set('');
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.name.set('');
    this.description.set('');
    this.error.set('');
  }

  submit() {
    this.saving.set(true);
    this.error.set('');

    const data = {
      name: this.name(),
      description: this.description() || null,
    };

    if (this.editingId() !== null) {
      this.blogService.updateCategory(this.editingId()!, data).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelForm();
          this.loadCategories();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'An error occurred.');
        },
      });
    } else {
      this.blogService.createCategory(data).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelForm();
          this.loadCategories();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'An error occurred.');
        },
      });
    }
  }

  deleteCategory(id: number) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    this.blogService.deleteCategory(id).subscribe({
      next: () => this.loadCategories(),
    });
  }
}
