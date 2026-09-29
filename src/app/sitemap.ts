import { MetadataRoute } from 'next';
import { fetchPublishedArticlesLive } from '@/src/features/articles/data/liveFirestoreService';
import { adminFirestoreVideoRepository } from '@/src/features/videos/data/adminFirestoreVideoRepository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://batutv.id';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tren`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/video`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/video/live`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  const fetchResult = await fetchPublishedArticlesLive(100);
  const articleRoutes: MetadataRoute.Sitemap = fetchResult.articles.map((article) => ({
    url: `${baseUrl}/berita/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : now,
    changeFrequency: 'daily',
    priority: article.isHeadline ? 0.9 : 0.7,
  }));

  let videoRoutes: MetadataRoute.Sitemap = [];
  try {
    const publishedVideos = await adminFirestoreVideoRepository.getVideos({
      status: 'published',
      limit: 100,
    });
    videoRoutes = publishedVideos
      .filter((v) => Boolean(v.slug))
      .map((video) => ({
        url: `${baseUrl}/video/${video.slug}`,
        lastModified: video.updatedAt ? new Date(video.updatedAt) : now,
        changeFrequency: 'daily',
        priority: 0.8,
      }));
  } catch (err) {
    console.warn('[sitemap] Failed to fetch published videos for sitemap:', err);
  }

  return [...staticRoutes, ...articleRoutes, ...videoRoutes];
}
