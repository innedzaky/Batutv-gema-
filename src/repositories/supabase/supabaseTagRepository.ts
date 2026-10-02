import { supabase } from '../../lib/supabase';
import { AdminTag, TagStatus, TagContentType } from '../../types/admin';
import { ITagRepository } from '../ITagRepository';
import { initialAdminTags } from '../../data/tagAdminDummyData';

export function toTagDbRow(tag: AdminTag): Record<string, any> {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    content_types: tag.contentTypes || ['news'],
    status: tag.status || 'active',
    news_count: tag.newsCount || 0,
    video_count: tag.videoCount || 0,
    total_count: tag.totalCount || 0,
    seo_title: tag.seoTitle || tag.name,
    meta_description: tag.metaDescription || '',
    created_at: tag.createdAt || new Date().toISOString(),
    updated_at: tag.updatedAt || new Date().toISOString(),
  };
}

export function fromTagDbRow(row: Record<string, any>): AdminTag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    contentTypes: (row.content_types as TagContentType[]) || ['news'],
    status: (row.status as TagStatus) || 'active',
    newsCount: row.news_count || 0,
    videoCount: row.video_count || 0,
    totalCount: row.total_count || 0,
    seoTitle: row.seo_title || row.name,
    metaDescription: row.meta_description || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  } as AdminTag;
}

export class SupabaseTagRepository implements ITagRepository {
  async getAll(): Promise<AdminTag[]> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return initialAdminTags;
      }
      return data.map(fromTagDbRow);
    } catch (err: any) {
      console.warn('[SupabaseTagRepository] getAll fallback:', err?.message);
      return initialAdminTags;
    }
  }

  async getById(id: string): Promise<AdminTag | null> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromTagDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseTagRepository] getById error:', err?.message);
      return null;
    }
  }

  async getBySlug(slug: string): Promise<AdminTag | null> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromTagDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseTagRepository] getBySlug error:', err?.message);
      return null;
    }
  }

  async create(tag: AdminTag): Promise<AdminTag> {
    const row = toTagDbRow(tag);
    const { data, error } = await supabase
      .from('tags')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return fromTagDbRow(data);
  }

  async update(id: string, partial: Partial<AdminTag>): Promise<AdminTag> {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (partial.name !== undefined) updates.name = partial.name;
    if (partial.slug !== undefined) updates.slug = partial.slug;
    if (partial.contentTypes !== undefined) updates.content_types = partial.contentTypes;
    if (partial.status !== undefined) updates.status = partial.status;
    if (partial.newsCount !== undefined) updates.news_count = partial.newsCount;
    if (partial.videoCount !== undefined) updates.video_count = partial.videoCount;
    if (partial.totalCount !== undefined) updates.total_count = partial.totalCount;
    if (partial.seoTitle !== undefined) updates.seo_title = partial.seoTitle;
    if (partial.metaDescription !== undefined) updates.meta_description = partial.metaDescription;

    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromTagDbRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw error;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const { data, error } = await supabase
      .from('tags')
      .delete()
      .in('id', ids)
      .select();

    if (error) throw error;
    return data?.length || 0;
  }

  async bulkUpdateStatus(ids: string[], status: TagStatus): Promise<number> {
    const { data, error } = await supabase
      .from('tags')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    if (error) throw error;
    return data?.length || 0;
  }

  subscribe(
    onNext: (tags: AdminTag[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getAll()
      .then((items) => onNext(items))
      .catch((err) => onError?.(err));

    const channel = supabase
      .channel('public:tags')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags' },
        () => {
          this.getAll().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for tags'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseTagRepository = new SupabaseTagRepository();
