import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ClientVideoDetailWrapper from '@/src/components/video/ClientVideoDetailWrapper';
import { adminFirestoreVideoRepository } from '@/src/features/videos/data/adminFirestoreVideoRepository';
import { resolveVideoThumbnail } from '@/src/features/videos/adapters/videoMapper';
import { extractYouTubeVideoId } from '@/src/utils/youtube';

/**
 * ISR Revalidation: 60 detik.
 * Selaras dengan artikel (/berita/[slug]), menjaga kecepatan akses instan
 * melalui edge cache (SSG/ISR) sekaligus memperbarui rilis video baru atau
 * perubahan judul/metadata dalam 1 menit.
 */
export const revalidate = 60;
export const dynamicParams = true;

interface NextVideoDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const videos = await adminFirestoreVideoRepository.getVideos({
      status: 'published',
      limit: 30,
    });
    return videos
      .filter((v) => Boolean(v.slug))
      .map((v) => ({
        slug: v.slug,
      }));
  } catch (err) {
    console.warn('[generateStaticParams:video] Fallback to empty array:', err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: NextVideoDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await adminFirestoreVideoRepository.getVideoBySlug(slug, 'published');

  if (!video || video.status !== 'published') {
    return {
      title: 'Video Tidak Ditemukan | BatuTV',
      description: 'Halaman video liputan berita yang Anda cari tidak ditemukan di portal BatuTV.',
    };
  }

  // Cek pengamanan jika konten dijadwalkan di masa depan
  if (video.scheduledAt && new Date(video.scheduledAt).getTime() > Date.now()) {
    return {
      title: 'Video Belum Tersedia | BatuTV',
      description: 'Halaman video liputan berita ini belum dirilis untuk publik.',
    };
  }

  const title = video.seoTitle || `${video.title} | Video BatuTV`;
  const description = video.metaDescription || video.excerpt || video.description || 'Liputan video terkini seputar Kota Batu dan Malang Raya dari BatuTV.';
  const thumbnailUrl = resolveVideoThumbnail(video);
  const videoId =
    video.youtubeVideoId ||
    (video.youtubeUrl ? extractYouTubeVideoId(video.youtubeUrl) : null) ||
    'dQw4w9WgXcQ';
  const canonicalUrl = video.canonicalUrl || `https://batutv.id/video/${video.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'video.other',
      url: canonicalUrl,
      images: thumbnailUrl
        ? [
            {
              url: thumbnailUrl,
              alt: video.title,
            },
          ]
        : [],
      videos: [
        {
          url: `https://www.youtube-nocookie.com/embed/${videoId}`,
          secureUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          type: 'text/html',
          width: 1280,
          height: 720,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: thumbnailUrl ? [thumbnailUrl] : [],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function NextVideoDetailPage({
  params,
}: NextVideoDetailPageProps) {
  const { slug } = await params;
  const video = await adminFirestoreVideoRepository.getVideoBySlug(slug, 'published');

  // Proteksi status: hanya video dengan status 'published' yang diizinkan tayang ke publik.
  // Draft, scheduled (belum waktunya), archived, dan trash dipicu ke Next.js notFound()
  // untuk mencegah kebocoran konten sebelum rilis resmi redaksi.
  if (!video || video.status !== 'published') {
    notFound();
  }

  if (video.scheduledAt && new Date(video.scheduledAt).getTime() > Date.now()) {
    notFound();
  }

  const videoId =
    video.youtubeVideoId ||
    (video.youtubeUrl ? extractYouTubeVideoId(video.youtubeUrl) : null) ||
    'dQw4w9WgXcQ';
  const thumbnailUrl = resolveVideoThumbnail(video);

  // Schema.org VideoObject Structured Data for SEO Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.excerpt || video.description || video.title,
    thumbnailUrl: [thumbnailUrl],
    uploadDate: video.publishedAt || video.createdAt || new Date().toISOString(),
    duration: video.duration ? `PT${video.duration.replace(':', 'M')}S` : undefined,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    contentUrl: video.youtubeUrl || `https://www.youtube.com/watch?v=${videoId}`,
    publisher: {
      '@type': 'Organization',
      name: 'BatuTV',
      logo: {
        '@type': 'ImageObject',
        url: 'https://batutv.id/batutv-logo.svg',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientVideoDetailWrapper slug={slug} />
    </>
  );
}
