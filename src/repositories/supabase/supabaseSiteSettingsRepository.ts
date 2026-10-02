import { supabase } from '../../lib/supabase';
import { SiteSettings } from '../../types/siteSettings';
import { ISiteSettingsRepository } from '../ISiteSettingsRepository';
const DEFAULT_SITE_SETTINGS: SiteSettings = {
  identity: {
    siteName: 'BATUTV',
    tagline: 'Portal Berita Batu Raya',
    siteDescription: 'Portal Berita Terkini, Akurat, dan Terpercaya Seputar Kota Batu, Malang Raya, Jawa Timur.',
    mainDomain: 'https://batutv.com',
  },
  logos: {
    headerDesktop: '/brand/batutv-logo.svg',
    headerDesktopAlt: 'BatuTV Logo Desktop',
    navbarCompact: '',
    navbarCompactAlt: 'BatuTV Navbar Badge',
    headerMobile: '/brand/batutv-logo.svg',
    headerMobileAlt: 'BatuTV Mobile Logo',
    footer: '/brand/batutv-logo.svg',
    footerAlt: 'BatuTV Media Network Footer Logo',
    darkMode: '/brand/batutv-logo-dark.svg',
    darkModeAlt: 'BatuTV Dark Mode Logo',
    publisherSchema: '/brand/batutv-logo-publisher.png',
    publisherSchemaAlt: 'BatuTV Publisher Logo',
  },
  favicon: {
    faviconUrl: '/favicon.ico',
    faviconAlt: 'BatuTV Favicon',
  },
  colors: {
    primary: '#D6001C',
    secondary: '#111827',
    accent: '#F59E0B',
    background: '#F8FAFC',
  },
  typography: {
    primaryFont: 'Inter',
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    baseFontSize: 16,
    scaleRatio: 1.25,
  },
};

export class SupabaseSiteSettingsRepository implements ISiteSettingsRepository {
  async getSettings(): Promise<SiteSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'current')
        .maybeSingle();

      if (error) throw error;
      if (!data) return DEFAULT_SITE_SETTINGS;

      return {
        identity: data.identity || DEFAULT_SITE_SETTINGS.identity,
        logos: data.logos || DEFAULT_SITE_SETTINGS.logos,
        favicon: data.favicon || DEFAULT_SITE_SETTINGS.favicon,
        colors: data.colors || DEFAULT_SITE_SETTINGS.colors,
        typography: data.typography || DEFAULT_SITE_SETTINGS.typography,
      };
    } catch (err: any) {
      console.warn('[SupabaseSiteSettingsRepository] getSettings fallback:', err?.message);
      return DEFAULT_SITE_SETTINGS;
    }
  }

  async saveSettings(settings: SiteSettings): Promise<SiteSettings> {
    const payload = {
      id: 'current',
      identity: settings.identity,
      logos: settings.logos,
      favicon: settings.favicon,
      colors: settings.colors,
      typography: settings.typography,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return settings;
  }

  subscribe(
    onNext: (settings: SiteSettings) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getSettings().then(onNext).catch(onError);

    const channel = supabase
      .channel('public:site_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => {
          this.getSettings().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for site_settings'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseSiteSettingsRepository = new SupabaseSiteSettingsRepository();
