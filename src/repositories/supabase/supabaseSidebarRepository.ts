import { supabase } from '../../lib/supabase';
import { GlobalSidebarSettings } from '../../types/sidebar';
const DEFAULT_SIDEBAR_SETTINGS: GlobalSidebarSettings = {
  homepage: {
    enabled: true,
    sticky: true,
    popularWidget: {
      enabled: true,
      title: 'BERITA TERPOPULER',
      timeframe: '24 Jam Terakhir',
      limit: 4,
    },
    specialEventWidget: {
      enabled: false,
      title: 'SOROTAN KHUSUS',
      eventTitle: 'Festival Budaya Kota Batu 2026',
      eventDescription: 'Ikuti liputan khusus festival tahunan wisata dan pesona Kota Batu.',
      eventBadge: 'LIPUTAN KHUSUS',
      eventImageUrl: '',
      actionText: 'Lihat Semua Liputan',
      actionUrl: '/kategori/wisata',
    },
    adBannerWidget: {
      enabled: false,
      title: 'RUANG IKLAN',
      imageUrl: '',
      targetUrl: '',
      size: 'medium',
    },
    trendingWidget: {
      enabled: true,
      title: 'TRENDING PEKAN INI',
      limit: 5,
      showButton: true,
    },
    viralTopicsWidget: {
      enabled: true,
      title: 'TOPIK VIRAL',
      limit: 5,
    },
  },
  article: {
    enabled: true,
    sticky: true,
    popularWidget: {
      enabled: true,
      title: 'TERPOPULER',
      timeframe: '24 Jam Terakhir',
      limit: 5,
    },
    discussionWidget: {
      enabled: true,
      title: 'DISKUSI TERPANAS',
      timeframe: 'Komentar Terbanyak',
      limit: 5,
    },
    topicsWidget: {
      enabled: true,
      title: 'TAGS & TOPIK POPULER',
      limit: 8,
    },
    adBannerWidget: {
      enabled: false,
      title: 'SPONSOR UTAMA',
      imageUrl: '',
      targetUrl: '',
      size: 'medium',
    },
  },
  video: {
    enabled: true,
    sticky: true,
    popularWidget: {
      enabled: true,
      title: 'POPULER',
      timeframe: '24 Jam Terakhir',
      limit: 5,
    },
    relatedVideosWidget: {
      enabled: true,
      title: 'VIDEO TERKAIT & TERBARU',
      limit: 5,
    },
    adBannerWidget: {
      enabled: false,
      title: 'IKLAN STREAMING',
      imageUrl: '',
      targetUrl: '',
      size: 'medium',
    },
  },
  updatedAt: new Date().toISOString(),
};

export class SupabaseSidebarRepository {
  async getSettings(): Promise<GlobalSidebarSettings> {
    try {
      const { data, error } = await supabase
        .from('sidebar_settings')
        .select('*')
        .eq('id', 'current')
        .maybeSingle();

      if (error) throw error;
      if (!data) return DEFAULT_SIDEBAR_SETTINGS;

      return {
        homepage: data.homepage_config || DEFAULT_SIDEBAR_SETTINGS.homepage,
        article: data.article_config || DEFAULT_SIDEBAR_SETTINGS.article,
        video: DEFAULT_SIDEBAR_SETTINGS.video,
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('[SupabaseSidebarRepository] getSettings fallback:', err?.message);
      return DEFAULT_SIDEBAR_SETTINGS;
    }
  }

  async saveSettings(settings: GlobalSidebarSettings): Promise<GlobalSidebarSettings> {
    const payload = {
      id: 'current',
      homepage_config: settings.homepage,
      article_config: settings.article,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('sidebar_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return settings;
  }

  subscribe(
    onNext: (settings: GlobalSidebarSettings) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getSettings().then(onNext).catch(onError);

    const channel = supabase
      .channel('public:sidebar_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sidebar_settings' },
        () => {
          this.getSettings().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for sidebar'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseSidebarRepository = new SupabaseSidebarRepository();
