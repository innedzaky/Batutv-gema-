import { supabase } from '../../lib/supabase';
import { AdminCategory, CategoryStatus, CategoryContentType } from '../../types/admin';
import { ICategoryRepository } from '../ICategoryRepository';
import { initialAdminCategories } from '../../data/categoryAdminDummyData';

export function toCategoryDbRow(cat: AdminCategory): Record<string, any> {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    color: (cat as any).color || '#D6001C',
    description: cat.description || '',
    parent_id: cat.parentId || null,
    content_types: cat.contentTypes || ['news'],
    status: cat.status || 'active',
    order: (cat as any).order ?? (cat as any).displayOrder ?? 0,
    seo_title: cat.seoTitle || `${cat.name} | BatuTV`,
    meta_description: cat.metaDescription || cat.description || '',
    canonical_url: cat.canonicalUrl || `/kategori/${cat.slug}`,
    news_count: cat.newsCount || 0,
    video_count: cat.videoCount || 0,
    total_count: cat.totalCount || 0,
    created_at: cat.createdAt || new Date().toISOString(),
    updated_at: cat.updatedAt || new Date().toISOString(),
  };
}

export function fromCategoryDbRow(row: Record<string, any>): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color || '#D6001C',
    description: row.description || '',
    parentId: row.parent_id || null,
    contentTypes: (row.content_types as CategoryContentType[]) || ['news', 'video'],
    status: (row.status as CategoryStatus) || 'active',
    seoTitle: row.seo_title || `${row.name} | BatuTV`,
    metaDescription: row.meta_description || row.description || '',
    canonicalUrl: row.canonical_url || `/kategori/${row.slug}`,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    newsCount: row.news_count || 0,
    videoCount: row.video_count || 0,
    totalCount: row.total_count || 0,
  } as AdminCategory;
}

export class SupabaseCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<AdminCategory[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return initialAdminCategories;
      }
      return data.map(fromCategoryDbRow);
    } catch (err: any) {
      console.warn('[SupabaseCategoryRepository] getAll fallback:', err?.message);
      return initialAdminCategories;
    }
  }

  async getById(id: string): Promise<AdminCategory | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromCategoryDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseCategoryRepository] getById error:', err?.message);
      return null;
    }
  }

  async getBySlug(slug: string): Promise<AdminCategory | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromCategoryDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseCategoryRepository] getBySlug error:', err?.message);
      return null;
    }
  }

  async create(category: AdminCategory): Promise<AdminCategory> {
    const row = toCategoryDbRow(category);
    const { data, error } = await supabase
      .from('categories')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return fromCategoryDbRow(data);
  }

  async update(id: string, partial: Partial<AdminCategory>): Promise<AdminCategory> {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (partial.name !== undefined) updates.name = partial.name;
    if (partial.slug !== undefined) updates.slug = partial.slug;
    if ((partial as any).color !== undefined) updates.color = (partial as any).color;
    if (partial.description !== undefined) updates.description = partial.description;
    if (partial.parentId !== undefined) updates.parent_id = partial.parentId;
    if (partial.contentTypes !== undefined) updates.content_types = partial.contentTypes;
    if (partial.status !== undefined) updates.status = partial.status;
    if ((partial as any).order !== undefined) updates.order = (partial as any).order;
    if (partial.seoTitle !== undefined) updates.seo_title = partial.seoTitle;
    if (partial.metaDescription !== undefined) updates.meta_description = partial.metaDescription;
    if (partial.canonicalUrl !== undefined) updates.canonical_url = partial.canonicalUrl;
    if (partial.newsCount !== undefined) updates.news_count = partial.newsCount;
    if (partial.videoCount !== undefined) updates.video_count = partial.videoCount;
    if (partial.totalCount !== undefined) updates.total_count = partial.totalCount;

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromCategoryDbRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  async bulkUpdateStatus(ids: string[], status: CategoryStatus): Promise<number> {
    const { data, error } = await supabase
      .from('categories')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    if (error) throw error;
    return data?.length || 0;
  }

  subscribe(
    onNext: (categories: AdminCategory[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    // Initial fetch
    this.getAll()
      .then((items) => onNext(items))
      .catch((err) => onError?.(err));

    // Realtime channel
    const channel = supabase
      .channel('public:categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          this.getAll().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for categories'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseCategoryRepository = new SupabaseCategoryRepository();
