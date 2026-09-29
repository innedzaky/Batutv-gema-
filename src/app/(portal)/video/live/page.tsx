import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { adminFirestoreVideoRepository } from '@/src/features/videos/data/adminFirestoreVideoRepository';
import { toPublicVideoItem } from '@/src/features/videos/adapters/videoMapper';
import { LiveStreamView } from '@/src/features/videos/components/LiveStreamView';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Live Streaming Siaran TV Digital | BatuTV Media Terpercaya Kota Wisata Batu',
  description:
    'Saksikan siaran langsung (live streaming) 24 jam BatuTV. Menayangkan warta berita aktual, liputan pariwisata Kota Batu, program agropolitan, dan kebudayaan Jawa Timur.',
  openGraph: {
    title: 'Live Streaming Siaran TV Digital BatuTV',
    description:
      'Tonton siaran langsung 24 jam liputan berita aktual dan program eksklusif Kota Wisata Batu di BatuTV.',
    url: 'https://batutv.id/video/live',
    siteName: 'BatuTV',
    type: 'video.other',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'BatuTV Live Streaming Broadcast',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Streaming Siaran TV Digital BatuTV',
    description:
      'Saksikan siaran langsung berita dan program unggulan Kota Wisata Batu secara streaming online.',
  },
  alternates: {
    canonical: 'https://batutv.id/video/live',
  },
};

export default async function VideoLivePage() {
  const rawVideos = await adminFirestoreVideoRepository.getVideos({
    status: 'published',
    limit: 6,
  });

  const publicVideos = rawVideos.map(toPublicVideoItem);

  // Schema.org BroadcastEvent & VideoObject for Live Stream rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BroadcastEvent',
    name: 'BatuTV Siaran Langsung TV Digital 24 Jam',
    description:
      'Siaran langsung program berita harian, dialog interaktif, dan sajian budaya dari Studio 1 BatuTV Kota Batu.',
    isLiveBroadcast: true,
    startDate: new Date().toISOString(),
    broadcastOfEvent: {
      '@type': 'Event',
      name: 'Batu Hari Ini Siang Live Broadcast',
      location: {
        '@type': 'Place',
        name: 'Studio Pusat BatuTV',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Kota Batu',
          addressRegion: 'Jawa Timur',
          addressCountry: 'ID',
        },
      },
    },
    video: {
      '@type': 'VideoObject',
      name: 'BatuTV Live Streaming',
      description: 'Siaran televisi digital lokal terkemuka Kota Batu dan Malang Raya.',
      thumbnailUrl: [
        'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=1200&auto=format&fit=crop&q=80',
      ],
      uploadDate: new Date().toISOString(),
      embedUrl:
        'https://www.youtube-nocookie.com/embed/live_stream?channel=UC8bTV_BatuTV_Official',
      publisher: {
        '@type': 'Organization',
        name: 'BatuTV',
        logo: {
          '@type': 'ImageObject',
          url: 'https://batutv.id/batutv-logo.svg',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:text-red-600 transition">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/video" className="hover:text-red-600 transition">
            Video & Siaran
          </Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            Live Streaming
          </span>
        </nav>

        {/* Live Stream View */}
        <LiveStreamView relatedVideos={publicVideos} />
      </div>
    </div>
  );
}
