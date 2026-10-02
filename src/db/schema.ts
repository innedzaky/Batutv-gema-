import { pgTable, text, integer, boolean, jsonb, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Tabel Kategori Berita & Video
 */
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  color: text('color').notNull().default('#D6001C'),
  description: text('description').default(''),
  parentId: text('parent_id'),
  contentTypes: jsonb('content_types').$type<string[]>().default(['news']),
  status: text('status').notNull().default('active'),
  order: integer('order').default(0),
  seoTitle: text('seo_title'),
  metaDescription: text('meta_description'),
  canonicalUrl: text('canonical_url'),
  newsCount: integer('news_count').default(0),
  videoCount: integer('video_count').default(0),
  totalCount: integer('total_count').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Tag / Topik Berita
 */
export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  contentTypes: jsonb('content_types').$type<string[]>().default(['news']),
  status: text('status').notNull().default('active'),
  newsCount: integer('news_count').default(0),
  videoCount: integer('video_count').default(0),
  totalCount: integer('total_count').default(0),
  seoTitle: text('seo_title'),
  metaDescription: text('meta_description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Penulis / Jurnalis / Wartawan
 */
export const authors = pgTable('authors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  position: text('position').notNull().default('Reporter'),
  email: text('email').notNull(),
  phone: text('phone'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  photoMediaId: text('photo_media_id'),
  status: text('status').notNull().default('active'),
  newsCount: integer('news_count').default(0),
  videoCount: integer('video_count').default(0),
  totalCount: integer('total_count').default(0),
  seoTitle: text('seo_title'),
  metaDescription: text('meta_description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Artikel Berita
 */
export const articles = pgTable('articles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull().default(''),
  content: text('content').notNull(), // String isi berita lengkap (atau serialized JSON)
  category: text('category').notNull(),
  categorySlug: text('category_slug').notNull(),
  categoryColor: text('category_color').default('#D6001C'),
  author: text('author').notNull(),
  authorId: text('author_id'),
  editor: text('editor').notNull().default(''),
  featuredImage: text('featured_image').notNull().default(''),
  imageCaption: text('image_caption').default(''),
  imageAlt: text('image_alt').default(''),
  status: text('status').notNull().default('draft'), // 'draft' | 'scheduled' | 'published' | 'trash'
  readTime: text('read_time').default('3 mnt baca'),
  views: integer('views').notNull().default(0),
  tags: jsonb('tags').$type<string[]>().default([]),
  isBreaking: boolean('is_breaking').notNull().default(false),
  isEditorPick: boolean('is_editor_pick').notNull().default(false),
  isTrending: boolean('is_trending').notNull().default(false),
  isHeadline: boolean('is_headline').notNull().default(false),
  headlinePosition: integer('headline_position'),
  headlineUntil: text('headline_until'),
  ranking: integer('ranking'),
  region: text('region').$type<'Batu' | 'Malang' | 'Jatim' | 'Nasional' | 'Internasional'>(),
  seoTitle: text('seo_title'),
  metaDescription: text('meta_description'),
  canonicalUrl: text('canonical_url'),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Relasi Many-to-Many Artikel dan Tag
 */
export const articleTags = pgTable('article_tags', {
  articleId: text('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.articleId, table.tagId] })
]);

/**
 * Tabel Video Liputan / Siaran
 */
export const videos = pgTable('videos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').default(''),
  description: text('description').default(''),
  youtubeUrl: text('youtube_url').notNull(),
  youtubeVideoId: text('youtube_video_id').notNull(),
  thumbnailSource: text('thumbnail_source').default('youtube'),
  customThumbnail: text('custom_thumbnail'),
  thumbnailMediaId: text('thumbnail_media_id'),
  customThumbnailAlt: text('custom_thumbnail_alt'),
  customThumbnailCaption: text('custom_thumbnail_caption'),
  duration: text('duration').default('00:00'),
  category: text('category').notNull(),
  categorySlug: text('category_slug'),
  author: text('author').notNull().default('Redaksi Batu TV'),
  authorId: text('author_id'),
  presenter: text('presenter'),
  program: text('program'),
  status: text('status').notNull().default('published'),
  views: integer('views').notNull().default(0),
  tags: jsonb('tags').$type<string[]>().default([]),
  seoTitle: text('seo_title'),
  metaDescription: text('meta_description'),
  canonicalUrl: text('canonical_url'),
  publishedAt: text('published_at'),
  scheduledAt: text('scheduled_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Pustaka Media / Foto Liputan
 */
export const media = pgTable('media', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  extension: text('extension').notNull(),
  mediaType: text('media_type').notNull().default('image'),
  width: integer('width').default(0),
  height: integer('height').default(0),
  fileSize: integer('file_size').default(0),
  altText: text('alt_text').default(''),
  caption: text('caption').default(''),
  description: text('description').default(''),
  url: text('url').notNull(),
  sizes: jsonb('sizes'),
  usageCount: integer('usage_count').default(0),
  usedIn: jsonb('used_in').default([]),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Pengguna CMS & Admin
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: text('role').notNull().default('reporter'),
  status: text('status').notNull().default('aktif'),
  authorId: text('author_id'),
  authorName: text('author_name'),
  authorPosition: text('author_position'),
  authorPhotoUrl: text('author_photo_url'),
  lastLogin: text('last_login'),
  lastLoginDetails: jsonb('last_login_details'),
  forcePasswordChange: boolean('force_password_change').default(false),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  sessionsCount: integer('sessions_count').default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Halaman Statis (Tentang Kami, Redaksi, Pedoman Siber, dll.)
 */
export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  status: text('status').notNull().default('published'),
  seoTitle: text('seo_title'),
  metaDescription: text('meta_description'),
  featuredImageUrl: text('featured_image_url'),
  featuredImageMediaId: text('featured_image_media_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'),
});

/**
 * Tabel Menu Navigasi Utama
 */
export const navigationItems = pgTable('navigation_items', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  type: text('type').notNull().default('internal'),
  targetType: text('target_type'),
  targetId: text('target_id'),
  url: text('url').notNull(),
  slug: text('slug').notNull(),
  parentId: text('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  openNewTab: boolean('open_new_tab').notNull().default(false),
  icon: text('icon'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Sub-Navigasi (Bar Kategori/Wilayah/Topik di Bawah Header)
 */
export const subNavigationItems = pgTable('sub_navigation_items', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  targetType: text('target_type').notNull().default('category'),
  targetId: text('target_id'),
  url: text('url').notNull(),
  slug: text('slug').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  openNewTab: boolean('open_new_tab').notNull().default(false),
  badge: text('badge'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Pengaturan Identitas Situs
 */
export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey().default('current'),
  identity: jsonb('identity'),
  logos: jsonb('logos'),
  favicon: jsonb('favicon'),
  colors: jsonb('colors'),
  typography: jsonb('typography'),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Konfigurasi Footer
 */
export const footerSettings = pgTable('footer_settings', {
  id: text('id').primaryKey().default('current'),
  mediaInfo: jsonb('media_info'),
  companyLinks: jsonb('company_links'),
  legalLinks: jsonb('legal_links'),
  socialMedia: jsonb('social_media'),
  copyright: jsonb('copyright'),
  logo: jsonb('logo'),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Konfigurasi Sidebar
 */
export const sidebarSettings = pgTable('sidebar_settings', {
  id: text('id').primaryKey().default('current'),
  homepageConfig: jsonb('homepage_config'),
  articleConfig: jsonb('article_config'),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Konfigurasi Sistem Umum
 */
export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey().default('current'),
  general: jsonb('general'),
  email: jsonb('email'),
  security: jsonb('security'),
  media: jsonb('media'),
  seo: jsonb('seo'),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Tabel Log Aktivitas Admin
 */
export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  targetTitle: text('target_title').notNull(),
  targetType: text('target_type').notNull(),
  timestamp: text('timestamp').notNull(),
  timeAgo: text('time_ago'),
});
