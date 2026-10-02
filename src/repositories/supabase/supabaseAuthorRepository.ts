import { supabase } from '../../lib/supabase';
import { AdminAuthor, AuthorStatus, AuthorPosition } from '../../types/admin';
import { IAuthorRepository } from '../IAuthorRepository';
import { initialAdminAuthors } from '../../data/authorAdminDummyData';

export function toAuthorDbRow(author: AdminAuthor): Record<string, any> {
  return {
    id: author.id,
    name: author.name,
    slug: author.slug,
    position: author.position || 'Reporter',
    email: author.email,
    phone: author.phone || '',
    bio: author.bio || '',
    photo_url: author.photoUrl || '',
    photo_media_id: author.photoMediaId || '',
    status: author.status || 'active',
    news_count: author.newsCount || 0,
    video_count: author.videoCount || 0,
    total_count: author.totalCount || 0,
    seo_title: author.seoTitle || author.name,
    meta_description: author.metaDescription || author.bio || '',
    created_at: author.createdAt || new Date().toISOString(),
    updated_at: author.updatedAt || new Date().toISOString(),
  };
}

export function fromAuthorDbRow(row: Record<string, any>): AdminAuthor {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    position: (row.position as AuthorPosition) || 'Reporter',
    email: row.email,
    phone: row.phone || '',
    bio: row.bio || '',
    photoUrl: row.photo_url || '',
    photoMediaId: row.photo_media_id || '',
    status: (row.status as AuthorStatus) || 'active',
    newsCount: row.news_count || 0,
    videoCount: row.video_count || 0,
    totalCount: row.total_count || 0,
    seoTitle: row.seo_title || row.name,
    metaDescription: row.meta_description || row.bio || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  } as AdminAuthor;
}

export class SupabaseAuthorRepository implements IAuthorRepository {
  async getAll(): Promise<AdminAuthor[]> {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return initialAdminAuthors;
      }
      return data.map(fromAuthorDbRow);
    } catch (err: any) {
      console.warn('[SupabaseAuthorRepository] getAll fallback:', err?.message);
      return initialAdminAuthors;
    }
  }

  async getById(id: string): Promise<AdminAuthor | null> {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromAuthorDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseAuthorRepository] getById error:', err?.message);
      return null;
    }
  }

  async getBySlug(slug: string): Promise<AdminAuthor | null> {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromAuthorDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseAuthorRepository] getBySlug error:', err?.message);
      return null;
    }
  }

  async getByEmail(email: string): Promise<AdminAuthor | null> {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromAuthorDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseAuthorRepository] getByEmail error:', err?.message);
      return null;
    }
  }

  async create(author: AdminAuthor): Promise<AdminAuthor> {
    const row = toAuthorDbRow(author);
    const { data, error } = await supabase
      .from('authors')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return fromAuthorDbRow(data);
  }

  async update(id: string, partial: Partial<AdminAuthor>): Promise<AdminAuthor> {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (partial.name !== undefined) updates.name = partial.name;
    if (partial.slug !== undefined) updates.slug = partial.slug;
    if (partial.position !== undefined) updates.position = partial.position;
    if (partial.email !== undefined) updates.email = partial.email;
    if (partial.phone !== undefined) updates.phone = partial.phone;
    if (partial.bio !== undefined) updates.bio = partial.bio;
    if (partial.photoUrl !== undefined) updates.photo_url = partial.photoUrl;
    if (partial.photoMediaId !== undefined) updates.photo_media_id = partial.photoMediaId;
    if (partial.status !== undefined) updates.status = partial.status;
    if (partial.newsCount !== undefined) updates.news_count = partial.newsCount;
    if (partial.videoCount !== undefined) updates.video_count = partial.videoCount;
    if (partial.totalCount !== undefined) updates.total_count = partial.totalCount;
    if (partial.seoTitle !== undefined) updates.seo_title = partial.seoTitle;
    if (partial.metaDescription !== undefined) updates.meta_description = partial.metaDescription;

    const { data, error } = await supabase
      .from('authors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromAuthorDbRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('authors').delete().eq('id', id);
    if (error) throw error;
  }

  async bulkUpdateStatus(ids: string[], status: AuthorStatus): Promise<number> {
    const { data, error } = await supabase
      .from('authors')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    if (error) throw error;
    return data?.length || 0;
  }

  subscribe(
    onNext: (authors: AdminAuthor[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getAll()
      .then((items) => onNext(items))
      .catch((err) => onError?.(err));

    const channel = supabase
      .channel('public:authors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'authors' },
        () => {
          this.getAll().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for authors'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseAuthorRepository = new SupabaseAuthorRepository();
