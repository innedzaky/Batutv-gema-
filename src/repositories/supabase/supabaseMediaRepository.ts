import { supabase } from '../../lib/supabase';
import { AdminMedia, MediaType } from '../../types/admin';
import { IMediaRepository } from '../IMediaRepository';
import { initialAdminMedia } from '../../data/mediaAdminDummyData';

export function toMediaDbRow(m: AdminMedia): Record<string, any> {
  return {
    id: m.id,
    filename: m.filename,
    original_name: m.originalName || m.filename,
    mime_type: m.mimeType || 'image/jpeg',
    extension: m.extension || 'jpg',
    media_type: m.mediaType || 'image',
    width: m.width || 0,
    height: m.height || 0,
    file_size: m.fileSize || 0,
    alt_text: m.altText || '',
    caption: m.caption || '',
    description: m.description || '',
    url: m.url,
    sizes: m.sizes || {},
    usage_count: m.usageCount || 0,
    used_in: (m.usedIn as any) || [],
    created_at: m.createdAt || new Date().toISOString(),
    updated_at: m.updatedAt || new Date().toISOString(),
  };
}

export function fromMediaDbRow(row: Record<string, any>): AdminMedia {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.original_name || row.filename,
    mimeType: row.mime_type || 'image/jpeg',
    extension: row.extension || 'jpg',
    mediaType: (row.media_type as MediaType) || 'image',
    width: Number(row.width) || 0,
    height: Number(row.height) || 0,
    fileSize: Number(row.file_size) || 0,
    altText: row.alt_text || '',
    caption: row.caption || '',
    description: row.description || '',
    url: row.url,
    sizes: row.sizes || {},
    usageCount: Number(row.usage_count) || 0,
    usedIn: row.used_in || [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export class SupabaseMediaRepository implements IMediaRepository {
  async getAll(filter?: { mediaType?: MediaType; search?: string }): Promise<AdminMedia[]> {
    try {
      let q = supabase.from('media').select('*');

      if (filter?.mediaType) {
        q = q.eq('media_type', filter.mediaType);
      }
      if (filter?.search) {
        q = q.ilike('filename', `%${filter.search}%`);
      }

      q = q.order('created_at', { ascending: false });

      const { data, error } = await q;

      if (error) throw error;
      if (!data || data.length === 0) {
        return initialAdminMedia;
      }
      return data.map(fromMediaDbRow);
    } catch (err: any) {
      console.warn('[SupabaseMediaRepository] getAll fallback:', err?.message);
      return initialAdminMedia;
    }
  }

  async getById(id: string): Promise<AdminMedia | null> {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromMediaDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseMediaRepository] getById error:', err?.message);
      return null;
    }
  }

  async create(media: AdminMedia): Promise<AdminMedia> {
    const row = toMediaDbRow(media);
    const { data, error } = await supabase
      .from('media')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return fromMediaDbRow(data);
  }

  async update(id: string, partial: Partial<AdminMedia>): Promise<AdminMedia> {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (partial.filename !== undefined) updates.filename = partial.filename;
    if (partial.altText !== undefined) updates.alt_text = partial.altText;
    if (partial.caption !== undefined) updates.caption = partial.caption;
    if (partial.description !== undefined) updates.description = partial.description;
    if (partial.url !== undefined) updates.url = partial.url;
    if (partial.usageCount !== undefined) updates.usage_count = partial.usageCount;
    if (partial.usedIn !== undefined) updates.used_in = partial.usedIn;

    const { data, error } = await supabase
      .from('media')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromMediaDbRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('media').delete().eq('id', id);
    if (error) throw error;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const { data, error } = await supabase
      .from('media')
      .delete()
      .in('id', ids)
      .select();

    if (error) throw error;
    return data?.length || 0;
  }

  subscribe(
    onNext: (mediaList: AdminMedia[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getAll()
      .then((items) => onNext(items))
      .catch((err) => onError?.(err));

    const channel = supabase
      .channel('public:media')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media' },
        () => {
          this.getAll().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for media'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseMediaRepository = new SupabaseMediaRepository();
