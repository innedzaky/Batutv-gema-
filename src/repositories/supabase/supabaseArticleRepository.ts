import { supabase } from '../../lib/supabase';
import { AdminArticle, ArticleStatus } from '../../types/admin';
import { IArticleRepository, ArticleQueryOptions } from '../IArticleRepository';
import { initialAdminArticles } from '../../data/newsAdminDummyData';

export function toArticleDbRow(art: AdminArticle): Record<string, any> {
  const contentStr = typeof art.content === 'string' ? art.content : JSON.stringify(art.content);
  return {
    id: art.id,
    title: art.title,
    slug: art.slug,
    excerpt: art.excerpt || '',
    content: contentStr,
    category: art.category,
    category_slug: art.categorySlug || 'berita',
    author: art.author,
    author_id: art.authorId || null,
    editor: art.editor || '',
    featured_image: art.featuredImage || '',
    image_caption: art.imageCaption || '',
    image_alt: art.imageAlt || '',
    status: art.status || 'published',
    read_time: '3 mnt baca',
    views: art.views || 0,
    tags: art.tags || [],
    is_headline: art.isHeadline || false,
    headline_position: art.headlinePosition || null,
    headline_until: art.headlineUntil || null,
    seo_title: art.seoTitle || art.title,
    meta_description: art.metaDescription || art.excerpt || '',
    canonical_url: art.canonicalUrl || `/berita/${art.slug}`,
    published_at: art.publishedAt || new Date().toISOString(),
    created_at: art.createdAt || new Date().toISOString(),
    updated_at: art.updatedAt || new Date().toISOString(),
  };
}

export function fromArticleDbRow(row: Record<string, any>): AdminArticle {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.content || '',
    category: row.category,
    categorySlug: row.category_slug || 'berita',
    author: row.author,
    authorId: row.author_id || undefined,
    editor: row.editor || '',
    featuredImage: row.featured_image || '',
    imageCaption: row.image_caption || '',
    imageAlt: row.image_alt || '',
    status: (row.status as ArticleStatus) || 'published',
    publishedAt: row.published_at || row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
    seoTitle: row.seo_title || row.title,
    metaDescription: row.meta_description || row.excerpt || '',
    canonicalUrl: row.canonical_url || `/berita/${row.slug}`,
    views: Number(row.views) || 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isHeadline: Boolean(row.is_headline),
    headlinePosition: row.headline_position || null,
    headlineUntil: row.headline_until || null,
  };
}

export class SupabaseArticleRepository implements IArticleRepository {
  async getArticles(options?: ArticleQueryOptions): Promise<AdminArticle[]> {
    try {
      let q = supabase.from('articles').select('*');

      if (options?.status) {
        q = q.eq('status', options.status);
      }
      if (options?.categorySlug) {
        q = q.eq('category_slug', options.categorySlug);
      }
      if (options?.authorId) {
        q = q.eq('author_id', options.authorId);
      }
      if (options?.isHeadline !== undefined) {
        q = q.eq('is_headline', options.isHeadline);
      }
      if (options?.limit) {
        q = q.limit(options.limit);
      }
      if (options?.offset) {
        q = q.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      q = q.order('created_at', { ascending: false });

      const { data, error } = await q;

      if (error) throw error;
      if (!data || data.length === 0) {
        return initialAdminArticles;
      }

      let res = data.map(fromArticleDbRow);
      if (options?.tag) {
        res = res.filter((a) => a.tags?.includes(options.tag!));
      }
      return res;
    } catch (err: any) {
      console.warn('[SupabaseArticleRepository] getArticles fallback:', err?.message);
      return initialAdminArticles;
    }
  }

  async getArticleById(id: string): Promise<AdminArticle | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromArticleDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseArticleRepository] getArticleById error:', err?.message);
      return null;
    }
  }

  async getArticleBySlug(slug: string): Promise<AdminArticle | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromArticleDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseArticleRepository] getArticleBySlug error:', err?.message);
      return null;
    }
  }

  async saveArticle(article: AdminArticle): Promise<AdminArticle> {
    const row = toArticleDbRow(article);
    const { data, error } = await supabase
      .from('articles')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return fromArticleDbRow(data);
  }

  async updateArticle(id: string, updates: Partial<AdminArticle>): Promise<AdminArticle> {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.slug !== undefined) updatePayload.slug = updates.slug;
    if (updates.excerpt !== undefined) updatePayload.excerpt = updates.excerpt;
    if (updates.content !== undefined) {
      updatePayload.content = typeof updates.content === 'string' ? updates.content : JSON.stringify(updates.content);
    }
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.categorySlug !== undefined) updatePayload.category_slug = updates.categorySlug;
    if (updates.author !== undefined) updatePayload.author = updates.author;
    if (updates.authorId !== undefined) updatePayload.author_id = updates.authorId;
    if (updates.editor !== undefined) updatePayload.editor = updates.editor;
    if (updates.featuredImage !== undefined) updatePayload.featured_image = updates.featuredImage;
    if (updates.imageCaption !== undefined) updatePayload.image_caption = updates.imageCaption;
    if (updates.imageAlt !== undefined) updatePayload.image_alt = updates.imageAlt;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.publishedAt !== undefined) updatePayload.published_at = updates.publishedAt;
    if (updates.seoTitle !== undefined) updatePayload.seo_title = updates.seoTitle;
    if (updates.metaDescription !== undefined) updatePayload.meta_description = updates.metaDescription;
    if (updates.canonicalUrl !== undefined) updatePayload.canonical_url = updates.canonicalUrl;
    if (updates.views !== undefined) updatePayload.views = updates.views;
    if (updates.tags !== undefined) updatePayload.tags = updates.tags;
    if (updates.isHeadline !== undefined) updatePayload.is_headline = updates.isHeadline;
    if (updates.headlinePosition !== undefined) updatePayload.headline_position = updates.headlinePosition;
    if (updates.headlineUntil !== undefined) updatePayload.headline_until = updates.headlineUntil;

    const { data, error } = await supabase
      .from('articles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromArticleDbRow(data);
  }

  async deleteArticle(id: string): Promise<void> {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
  }

  async bulkUpdateStatus(ids: string[], status: ArticleStatus): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase.from('articles').delete().in('id', ids);
    if (error) throw error;
  }

  subscribe(
    onNext: (articles: AdminArticle[]) => void,
    onError?: (error: Error) => void,
    options?: ArticleQueryOptions
  ): () => void {
    this.getArticles(options)
      .then((items) => onNext(items))
      .catch((err) => onError?.(err));

    const channel = supabase
      .channel('public:articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles' },
        () => {
          this.getArticles(options).then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for articles'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseArticleRepository = new SupabaseArticleRepository();
