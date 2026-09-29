import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Tv, Flame, Play, Sparkles } from 'lucide-react';
import { adminFirestoreVideoRepository } from '@/src/features/videos/data/adminFirestoreVideoRepository';
import { toPublicVideoItem } from '@/src/features/videos/adapters/videoMapper';
import { VideoBentoGrid } from '@/src/features/videos/components/VideoBentoGrid';
import { VideoCatalog } from '@/src/features/videos/components/VideoCatalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Video & Live Streaming Berita BatuTV | Portal Resmi Kota Wisata Batu',
  description:
    'Saksikan tayangan liputan berita terkini, siaran langsung (live streaming), dan video program eksklusif seputar Kota Batu, Malang Raya, dan Jawa Timur di BatuTV.',
  openGraph: {
    title: 'Video & Live Streaming Berita BatuTV',
    description:
      'Pusat tayangan video jurnalistik terpercaya, live streaming siaran TV, dan liputan daerah dari BatuTV.',
    url: 'https://batutv.id/video',
    siteName: 'BatuTV',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'BatuTV Video & Siaran Streaming',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video & Live Streaming Berita BatuTV',
    description:
      'Tayangan liputan berita terkini, siaran langsung, dan video program eksklusif BatuTV.',
  },
  alternates: {
    canonical: 'https://batutv.id/video',
  },
};

export default async function VideoPortalPage() {
  const rawVideos = await adminFirestoreVideoRepository.getVideos({
    status: 'published',
    limit: 60,
  });

  const publicVideos = rawVideos.map(toPublicVideoItem);

  // Schema.org CollectionPage / ItemList structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'BatuTV Video & Siaran Streaming',
    description:
      'Kumpulan liputan video berita, talkshow, dan siaran langsung Kota Batu dan Malang Raya.',
    url: 'https://batutv.id/video',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: publicVideos.slice(0, 10).map((v, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://batutv.id/video/${v.slug}`,
        name: v.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:text-red-600 transition">
            Beranda
          </Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            Video & Siaran
          </span>
        </nav>

        {/* Hero Banner Header */}
        <header className="relative rounded-2xl bg-linear-to-r from-neutral-900 via-neutral-900 to-red-950 text-white p-6 sm:p-8 overflow-hidden shadow-md">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold tracking-wide uppercase shadow-xs">
              <Tv className="w-3.5 h-3.5" />
              <span>BatuTV Multimedia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-serif">
              Galeri Video & Live Streaming
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 line-clamp-2">
              Saksikan liputan jurnalisme visual aktual, dokumenter kebudayaan daerah, serta laporan langsung peristiwa di Kota Wisata Batu dan sekitarnya.
            </p>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none hidden md:block">
            <Tv className="w-72 h-72 text-white" />
          </div>
        </header>

        {/* Featured Bento Grid Video Section */}
        {publicVideos.length > 0 && (
          <VideoBentoGrid
            videos={publicVideos}
            title="Tayangan Pilihan Redaksi"
            showLiveButton={true}
          />
        )}

        {/* Complete Video Catalog Section */}
        <section className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase font-serif">
              Semua Video Berita
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {publicVideos.length} Video Tersedia
            </span>
          </div>

          <VideoCatalog initialVideos={publicVideos} />
        </section>
      </div>
    </div>
  );
}
