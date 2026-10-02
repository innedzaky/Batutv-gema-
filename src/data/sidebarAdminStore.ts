import {
  GlobalSidebarSettings,
  HomepageSidebarConfig,
  ArticleSidebarConfig,
  VideoSidebarConfig,
} from '../types/sidebar';
import { supabaseSidebarRepository } from '../repositories/supabase/supabaseSidebarRepository';

export const SIDEBAR_STORAGE_KEY = 'batutv_sidebar_settings';
export const SIDEBAR_UPDATED_EVENT = 'batutv_sidebar_updated';

export const INITIAL_HOMEPAGE_SIDEBAR: HomepageSidebarConfig = {
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
};

export const INITIAL_ARTICLE_SIDEBAR: ArticleSidebarConfig = {
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
};

export const INITIAL_VIDEO_SIDEBAR: VideoSidebarConfig = {
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
};

export const INITIAL_SIDEBAR_SETTINGS: GlobalSidebarSettings = {
  homepage: INITIAL_HOMEPAGE_SIDEBAR,
  article: INITIAL_ARTICLE_SIDEBAR,
  video: INITIAL_VIDEO_SIDEBAR,
  updatedAt: new Date().toISOString(),
};

let inMemorySettings: GlobalSidebarSettings = loadLocalSettings();

function loadLocalSettings(): GlobalSidebarSettings {
  if (typeof window === 'undefined') {
    return INITIAL_SIDEBAR_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        homepage: { ...INITIAL_HOMEPAGE_SIDEBAR, ...(parsed.homepage || {}) },
        article: { ...INITIAL_ARTICLE_SIDEBAR, ...(parsed.article || {}) },
        video: { ...INITIAL_VIDEO_SIDEBAR, ...(parsed.video || {}) },
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Gagal membaca cache lokal sidebar settings:', err);
  }
  return INITIAL_SIDEBAR_SETTINGS;
}

export function getStoredSidebarSettings(): GlobalSidebarSettings {
  if (typeof window !== 'undefined' && (!inMemorySettings || !inMemorySettings.homepage)) {
    inMemorySettings = loadLocalSettings();
  }
  return inMemorySettings || INITIAL_SIDEBAR_SETTINGS;
}

export async function saveSidebarSettings(newSettings: GlobalSidebarSettings): Promise<boolean> {
  const updated: GlobalSidebarSettings = {
    ...newSettings,
    updatedAt: new Date().toISOString(),
  };

  inMemorySettings = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(SIDEBAR_UPDATED_EVENT, { detail: updated }));
    } catch (e) {
      console.warn('Gagal menulis localStorage sidebar settings:', e);
    }
  }

  // Sync to Supabase in background
  try {
    supabaseSidebarRepository.saveSettings(updated).catch((err) => {
      console.warn('Gagal sinkronisasi sidebar settings ke Supabase:', err);
    });
  } catch (err) {
    console.warn('Gagal sinkronisasi sidebar settings (offline fallback aktif):', err);
  }

  return true;
}

export function resetSidebarSettings(): GlobalSidebarSettings {
  inMemorySettings = INITIAL_SIDEBAR_SETTINGS;
  if (typeof window !== 'undefined') {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(INITIAL_SIDEBAR_SETTINGS));
    window.dispatchEvent(new CustomEvent(SIDEBAR_UPDATED_EVENT, { detail: INITIAL_SIDEBAR_SETTINGS }));
    supabaseSidebarRepository.saveSettings(INITIAL_SIDEBAR_SETTINGS).catch(() => {});
  }
  return INITIAL_SIDEBAR_SETTINGS;
}

// Initial Supabase listener setup in browser
if (typeof window !== 'undefined') {
  try {
    supabaseSidebarRepository.subscribe((settings) => {
      if (settings && settings.homepage) {
        inMemorySettings = settings;
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent(SIDEBAR_UPDATED_EVENT, { detail: settings }));
      }
    });
  } catch (_e) {
    // Ignore error in non-configured env
  }
}
