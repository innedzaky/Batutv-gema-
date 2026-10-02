import { supabase } from '../../lib/supabase';
import { AdminVideo, VideoStatus } from '../../types/admin';
import { IVideoRepository, VideoQueryOptions } from '../IVideoRepository';
import { initialAdminVideos } from '../../data/videoAdminDummyData';

export function toVideoDbRow(video: AdminVideo): Record<string, any> {
  return {
    id: video.id,
    title: video.title,
    slug: video.slug,
    excerpt: video.excerpt || '',
    description: video.description || '',
    youtube_url: video.youtubeUrl,
    youtube_video_id: video.youtubeVideoId,
    thumbnail_source: video.thumbnailSource || 'youtube',
    custom_thumbnail: video.customThumbnail || '',
    thumbnail_media_id: video.thumbnailMediaId || '',
    custom_thumbnail_alt: video.customThumbnailAlt || '',
    custom_thumbnail_caption: video.customThumbnailCaption || '',
    duration: video.duration || '00:00',
    category: video.category,
    category_slug: video.categorySlug || 'liputan-khusus',
    author: video.author || 'Redaksi Batu TV',
    author_id: video.authorId || null,
    status: video.status || 'published',
    views: video.views || 0,
    tags: video.tags || [],
    seo_title: video.seoTitle || video.title,
    meta_description: video.metaDescription || video.excerpt || '',
    canonical_url: video.canonicalUrl || `/video/${video.slug}`,
    published_at: video.publishedAt || new Date().toISOString(),
    scheduled_at: video.scheduledAt || null,
    created_at: video.createdAt || new Date().toISOString(),
    updated_at: video.updatedAt || new Date().toISOString(),
  };
}

export function fromVideoDbRow(row: Record<string, any>): AdminVideo {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    description: row.description || '',
    youtubeUrl: row.youtube_url || '',
    youtubeVideoId: row.youtube_video_id || '',
    thumbnailSource: (row.thumbnail_source as 'youtube' | 'custom') || 'youtube',
    customThumbnail: row.custom_thumbnail || undefined,
    thumbnailMediaId: row.thumbnail_media_id || undefined,
    customThumbnailAlt: row.custom_thumbnail_alt || undefined,
    customThumbnailCaption: row.custom_thumbnail_caption || undefined,
    duration: row.duration || '00:00',
    category: row.category,
    categorySlug: row.category_slug || 'liputan-khusus',
    author: row.author || 'Redaksi Batu TV',
    authorId: row.author_id || undefined,
    status: (row.status as VideoStatus) || 'published',
    publishedAt: row.published_at || row.created_at || new Date().toISOString(),
    scheduledAt: row.scheduled_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    seoTitle: row.seo_title || row.title,
    metaDescription: row.meta_description || row.excerpt || '',
    canonicalUrl: row.canonical_url || `/video/${row.slug}`,
    views: Number(row.views) || 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

export class SupabaseVideoRepository implements IVideoRepository {
  async getVideos(options?: VideoQueryOptions): Promise<AdminVideo[]> {
    try {
      let q = supabase.from('videos').select('*');

      if (options?.status) {
        q = q.eq('status', options.status);
      }
      if (options?.categorySlug) {
        q = q.eq('category_slug', options.categorySlug);
      }
      if (options?.authorId) {
        q = q.eq('author_id', options.authorId);
      }
      if (options?.limit) {
        q = q.limit(options.limit);
      }

      q = q.order('created_at', { ascending: false });

      const { data, error } = await q;

      if (error) throw error;
      if (!data || data.length === 0) {
        return initialAdminVideos;
      }
      return data.map(fromVideoDbRow);
    } catch (err: any) {
      console.warn('[SupabaseVideoRepository] getVideos fallback:', err?.message);
      return initialAdminVideos;
    }
  }

  async getVideoById(id: string): Promise<AdminVideo | null> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromVideoDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseVideoRepository] getVideoById error:', err?.message);
      return null;
    }
  }

  async getVideoBySlug(slug: string, status?: VideoStatus): Promise<AdminVideo | null> {
    try {
      let q = supabase.from('videos').select('*').eq('slug', slug);
      if (status) {
        q = q.eq('status', status);
      }
      const { data, error } = await q.maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromVideoDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseVideoRepository] getVideoBySlug error:', err?.message);
      return null;
    }
  }

  async saveVideo(video: AdminVideo): Promise<AdminVideo> {
    const row = toVideoDbRow(video);
    const { data, error } = await supabase
      .from('videos')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return fromVideoDbRow(data);
  }

  async updateVideo(id: string, updates: Partial<AdminVideo>): Promise<AdminVideo> {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.slug !== undefined) updatePayload.slug = updates.slug;
    if (updates.excerpt !== undefined) updatePayload.excerpt = updates.excerpt;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.youtubeUrl !== undefined) updatePayload.youtube_url = updates.youtubeUrl;
    if (updates.youtubeVideoId !== undefined) updatePayload.youtube_video_id = updates.youtubeVideoId;
    if (updates.thumbnailSource !== undefined) updatePayload.thumbnail_source = updates.thumbnailSource;
    if (updates.customThumbnail !== undefined) updatePayload.custom_thumbnail = updates.customThumbnail;
    if (updates.thumbnailMediaId !== undefined) updatePayload.thumbnail_media_id = updates.thumbnailMediaId;
    if (updates.duration !== undefined) updatePayload.duration = updates.duration;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.categorySlug !== undefined) updatePayload.category_slug = updates.categorySlug;
    if (updates.author !== undefined) updatePayload.author = updates.author;
    if (updates.authorId !== undefined) updatePayload.author_id = updates.authorId;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.publishedAt !== undefined) updatePayload.published_at = updates.publishedAt;
    if (updates.scheduledAt !== undefined) updatePayload.scheduled_at = updates.scheduledAt;
    if (updates.seoTitle !== undefined) updatePayload.seo_title = updates.seoTitle;
    if (updates.metaDescription !== undefined) updatePayload.meta_description = updates.metaDescription;
    if (updates.canonicalUrl !== undefined) updatePayload.canonical_url = updates.canonicalUrl;
    if (updates.views !== undefined) updatePayload.views = updates.views;
    if (updates.tags !== undefined) updatePayload.tags = updates.tags;

    const { data, error } = await supabase
      .from('videos')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromVideoDbRow(data);
  }

  async deleteVideo(id: string): Promise<void> {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) throw error;
  }

  async bulkUpdateStatus(ids: string[], status: VideoStatus): Promise<void> {
    const { error } = await supabase
      .from('videos')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase.from('videos').delete().in('id', ids);
    if (error) throw error;
  }

  subscribe(
    onNext: (videos: AdminVideo[]) => void,
    onError?: (error: Error) => void,
    options?: VideoQueryOptions
  ): () => void {
    this.getVideos(options)
      .then((items) => onNext(items))
      .catch((err) => onError?.(err));

    const channel = supabase
      .channel('public:videos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'videos' },
        () => {
          this.getVideos(options).then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for videos'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseVideoRepository = new SupabaseVideoRepository();
