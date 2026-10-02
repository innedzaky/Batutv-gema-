import { supabase } from '../../lib/supabase';
import { AdminPage, PageStatus } from '../../types/admin';
import { IPageRepository } from '../IPageRepository';
import { initialAdminPagesData } from '../../data/pagesAdminDummyData';

export function toPageDbRow(p: AdminPage): Record<string, any> {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    excerpt: p.excerpt || '',
    status: p.status || 'published',
    seo_title: p.seoTitle || p.title,
    meta_description: p.metaDescription || p.excerpt || '',
    featured_image_url: p.featuredImageUrl || '',
    featured_image_media_id: p.featuredImageMediaId || '',
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
    published_at: p.publishedAt || null,
  };
}

export function fromPageDbRow(row: Record<string, any>): AdminPage {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt || undefined,
    status: (row.status as PageStatus) || 'published',
    seoTitle: row.seo_title || undefined,
    metaDescription: row.meta_description || undefined,
    featuredImageUrl: row.featured_image_url || undefined,
    featuredImageMediaId: row.featured_image_media_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    publishedAt: row.published_at || null,
  };
}

export class SupabasePageRepository implements IPageRepository {
  async getAll(): Promise<AdminPage[]> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return initialAdminPagesData;
      }
      return data.map(fromPageDbRow);
    } catch (err: any) {
      console.warn('[SupabasePageRepository] getAll fallback:', err?.message);
      return initialAdminPagesData;
    }
  }

  async getById(id: string): Promise<AdminPage | null> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromPageDbRow(data);
    } catch (err: any) {
      console.warn('[SupabasePageRepository] getById error:', err?.message);
      return null;
    }
  }

  async getBySlug(slug: string): Promise<AdminPage | null> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromPageDbRow(data);
    } catch (err: any) {
      console.warn('[SupabasePageRepository] getBySlug error:', err?.message);
      return null;
    }
  }

  async getPublished(): Promise<AdminPage[]> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('status', 'published')
        .order('title', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return initialAdminPagesData.filter((p) => p.status === 'published');
      }
      return data.map(fromPageDbRow);
    } catch (err: any) {
      console.warn('[SupabasePageRepository] getPublished fallback:', err?.message);
      return initialAdminPagesData.filter((p) => p.status === 'published');
    }
  }

  async create(page: AdminPage): Promise<AdminPage> {
    const row = toPageDbRow(page);
    const { data, error } = await supabase
      .from('pages')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return fromPageDbRow(data);
  }

  async update(id: string, partial: Partial<AdminPage>): Promise<AdminPage> {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (partial.title !== undefined) updates.title = partial.title;
    if (partial.slug !== undefined) updates.slug = partial.slug;
    if (partial.content !== undefined) updates.content = partial.content;
    if (partial.excerpt !== undefined) updates.excerpt = partial.excerpt;
    if (partial.status !== undefined) updates.status = partial.status;
    if (partial.seoTitle !== undefined) updates.seo_title = partial.seoTitle;
    if (partial.metaDescription !== undefined) updates.meta_description = partial.metaDescription;
    if (partial.featuredImageUrl !== undefined) updates.featured_image_url = partial.featuredImageUrl;
    if (partial.featuredImageMediaId !== undefined) updates.featured_image_media_id = partial.featuredImageMediaId;
    if (partial.publishedAt !== undefined) updates.published_at = partial.publishedAt;

    const { data, error } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromPageDbRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) throw error;
  }

  subscribe(
    onNext: (pages: AdminPage[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getAll()
      .then((items) => onNext(items))
      .catch((err) => onError?.(err));

    const channel = supabase
      .channel('public:pages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pages' },
        () => {
          this.getAll().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for pages'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabasePageRepository = new SupabasePageRepository();
