export interface User {
  id: number;
  name: string;
  username: string;
  email?: string;
  avatar_url: string | null;
  bio: string | null;
  roles?: string[];
  posts?: Post[];
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  categories?: Category[];
  tags?: Tag[];
  comments?: Comment[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  posts_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
}

export interface Comment {
  id: number;
  content: string;
  is_approved: boolean;
  created_at: string;
  user: User;
  replies?: Comment[];
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  prev_page_url: string | null;
  next_page_url: string | null;
}
