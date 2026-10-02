import { supabase } from '../../lib/supabase';
import { FooterConfig } from '../../types/footer';
import { IFooterRepository } from '../IFooterRepository';
const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  mediaInfo: {
    mediaName: 'BatuTV Media Network',
    shortDescription: 'Portal berita dan streaming televisi lokal terpercaya Malang Raya dan Jawa Timur.',
    address: 'Jl. TVRI No. 1, Oro-Oro Ombo, Kec. Batu',
    city: 'Kota Batu',
    province: 'Jawa Timur',
    postalCode: '65316',
    editorialEmail: 'redaksi@batutv.id',
    businessEmail: 'marketing@batutv.id',
    phoneNumber: '+62 341 590001',
    whatsappNumber: '+62 812-3456-7890',
  },
  companyLinks: {
    tentangKamiUrl: '/tentang-kami',
    redaksiUrl: '/redaksi',
    kontakUrl: '/kontak-kami',
    karirUrl: '/karir',
  },
  legalLinks: {
    pedomanMediaSiberUrl: '/pedoman-media-siber',
    kodeEtikJurnalistikUrl: '/kode-etik-jurnalistik',
    disclaimerUrl: '/disclaimer',
    privacyPolicyUrl: '/kebijakan-privasi',
    termsOfServiceUrl: '/syarat-ketentuan',
  },
  socialMedia: {
    showSection: true,
    headingText: 'Ikuti kami di:',
    facebookUrl: 'https://facebook.com/batutvofficial',
    showFacebook: true,
    instagramUrl: 'https://instagram.com/batutv_official',
    showInstagram: true,
    youtubeUrl: 'https://youtube.com/@batutv',
    showYoutube: true,
    tiktokUrl: 'https://tiktok.com/@batutv',
    showTiktok: true,
    xTwitterUrl: 'https://x.com/batutv_official',
    showXTwitter: true,
    telegramUrl: 'https://t.me/batutvchannel',
    showTelegram: false,
    linkedInUrl: '',
    showLinkedIn: false,
  },
  copyright: {
    copyrightText: `© ${new Date().getFullYear()} BatuTV. Hak Cipta Dilindungi Undang-Undang.`,
    networkSubtitle: 'Bagian dari Jaringan Media Televisi Lokal Indonesia',
  },
  logo: {
    showLogo: true,
    logoUrl: '/brand/batutv-logo.svg',
    altText: 'Logo BatuTV Footer',
  },
};

export class SupabaseFooterRepository implements IFooterRepository {
  async getConfig(): Promise<FooterConfig> {
    try {
      const { data, error } = await supabase
        .from('footer_settings')
        .select('*')
        .eq('id', 'current')
        .maybeSingle();

      if (error) throw error;
      if (!data) return DEFAULT_FOOTER_CONFIG;

      return {
        mediaInfo: data.media_info || DEFAULT_FOOTER_CONFIG.mediaInfo,
        companyLinks: data.company_links || DEFAULT_FOOTER_CONFIG.companyLinks,
        legalLinks: data.legal_links || DEFAULT_FOOTER_CONFIG.legalLinks,
        socialMedia: data.social_media || DEFAULT_FOOTER_CONFIG.socialMedia,
        copyright: data.copyright || DEFAULT_FOOTER_CONFIG.copyright,
        logo: data.logo || DEFAULT_FOOTER_CONFIG.logo,
      };
    } catch (err: any) {
      console.warn('[SupabaseFooterRepository] getConfig fallback:', err?.message);
      return DEFAULT_FOOTER_CONFIG;
    }
  }

  async saveConfig(config: FooterConfig): Promise<FooterConfig> {
    const payload = {
      id: 'current',
      media_info: config.mediaInfo,
      company_links: config.companyLinks,
      legal_links: config.legalLinks,
      social_media: config.socialMedia,
      copyright: config.copyright,
      logo: config.logo,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('footer_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return config;
  }

  subscribe(
    onNext: (config: FooterConfig) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getConfig().then(onNext).catch(onError);

    const channel = supabase
      .channel('public:footer_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'footer_settings' },
        () => {
          this.getConfig().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for footer'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseFooterRepository = new SupabaseFooterRepository();
