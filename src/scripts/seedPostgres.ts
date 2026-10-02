import * as dotenv from 'dotenv';
dotenv.config();

import { db, client } from '../db/index';
import * as schema from '../db/schema';
import { initialAdminCategories } from '../data/categoryAdminDummyData';
import { initialAdminTags } from '../data/tagAdminDummyData';
import { initialAdminAuthors } from '../data/authorAdminDummyData';
import { initialAdminMedia } from '../data/mediaAdminDummyData';
import { initialAdminPagesData } from '../data/pagesAdminDummyData';
import {
  INITIAL_NAVIGATION_DATA,
  INITIAL_SUB_NAVIGATION_DATA,
} from '../data/navigationStore';
import { INITIAL_FOOTER_CONFIG } from '../data/footerAdminStore';
import { INITIAL_SITE_SETTINGS } from '../data/siteSettingsStore';
import {
  DEFAULT_SYSTEM_INFO,
  DEFAULT_MAINTENANCE_CONFIG,
  DEFAULT_SECURITY_CONFIG,
} from '../data/systemSettingsStore';
import { INITIAL_CMS_USERS } from '../data/userAdminStore';
import { initialAdminArticles } from '../data/newsAdminDummyData';
import { initialAdminVideos } from '../data/videoAdminDummyData';
import { INITIAL_HOMEPAGE_SIDEBAR, INITIAL_ARTICLE_SIDEBAR } from '../data/sidebarAdminStore';

export async function runPostgresSeeder() {
  console.log('====================================================');
  console.log('🚀 SEEDING SUPABASE POSTGRESQL DATABASE VIA DRIZZLE');
  console.log('====================================================\n');

  try {
    // 1. Categories
    console.log('📁 Seeding categories...');
    for (const cat of initialAdminCategories) {
      await db
        .insert(schema.categories)
        .values({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          color: (cat as any).color || '#D6001C',
          description: cat.description || '',
          parentId: cat.parentId || null,
          contentTypes: cat.contentTypes || ['news'],
          status: cat.status || 'active',
          order: (cat as any).order ?? 0,
          seoTitle: cat.seoTitle || cat.name,
          metaDescription: cat.metaDescription || cat.description,
          canonicalUrl: cat.canonicalUrl || `/kategori/${cat.slug}`,
          newsCount: cat.newsCount || 0,
          videoCount: cat.videoCount || 0,
          totalCount: cat.totalCount || 0,
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Categories seeded: ${initialAdminCategories.length}`);

    // 2. Tags
    console.log('🏷️  Seeding tags...');
    for (const t of initialAdminTags) {
      await db
        .insert(schema.tags)
        .values({
          id: t.id,
          name: t.name,
          slug: t.slug,
          contentTypes: t.contentTypes || ['news'],
          status: t.status || 'active',
          newsCount: t.newsCount || 0,
          videoCount: t.videoCount || 0,
          totalCount: t.totalCount || 0,
          seoTitle: t.seoTitle || t.name,
          metaDescription: t.metaDescription || '',
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Tags seeded: ${initialAdminTags.length}`);

    // 3. Authors
    console.log('✍️  Seeding authors...');
    for (const a of initialAdminAuthors) {
      await db
        .insert(schema.authors)
        .values({
          id: a.id,
          name: a.name,
          slug: a.slug,
          position: a.position || 'Reporter',
          email: a.email,
          phone: a.phone || '',
          bio: a.bio || '',
          photoUrl: a.photoUrl || '',
          photoMediaId: a.photoMediaId || '',
          status: a.status || 'active',
          newsCount: a.newsCount || 0,
          videoCount: a.videoCount || 0,
          totalCount: a.totalCount || 0,
          seoTitle: a.seoTitle || a.name,
          metaDescription: a.metaDescription || a.bio,
          createdAt: a.createdAt || new Date().toISOString(),
          updatedAt: a.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Authors seeded: ${initialAdminAuthors.length}`);

    // 4. Media Library
    console.log('🖼️  Seeding media...');
    for (const m of initialAdminMedia) {
      await db
        .insert(schema.media)
        .values({
          id: m.id,
          filename: m.filename,
          originalName: m.originalName || m.filename,
          mimeType: m.mimeType || 'image/jpeg',
          extension: m.extension || 'jpg',
          mediaType: m.mediaType || 'image',
          width: m.width || 0,
          height: m.height || 0,
          fileSize: m.fileSize || 0,
          altText: m.altText || '',
          caption: m.caption || '',
          description: m.description || '',
          url: m.url,
          sizes: m.sizes || {},
          usageCount: m.usageCount || 0,
          usedIn: (m.usedIn as any) || [],
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Media items seeded: ${initialAdminMedia.length}`);

    // 5. Pages
    console.log('📄 Seeding pages...');
    for (const p of initialAdminPagesData) {
      await db
        .insert(schema.pages)
        .values({
          id: p.id,
          title: p.title,
          slug: p.slug,
          content: p.content,
          excerpt: p.excerpt || '',
          status: p.status || 'published',
          seoTitle: p.seoTitle || p.title,
          metaDescription: p.metaDescription || p.excerpt,
          featuredImageUrl: p.featuredImageUrl || '',
          featuredImageMediaId: p.featuredImageMediaId || '',
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          publishedAt: p.publishedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Pages seeded: ${initialAdminPagesData.length}`);

    // 6. Articles
    console.log('📰 Seeding articles...');
    for (const art of initialAdminArticles) {
      await db
        .insert(schema.articles)
        .values({
          id: art.id,
          title: art.title,
          slug: art.slug,
          excerpt: art.excerpt || '',
          content: typeof art.content === 'string' ? art.content : JSON.stringify(art.content),
          category: art.category,
          categorySlug: art.categorySlug || 'berita',
          categoryColor: '#D6001C',
          author: art.author,
          authorId: art.authorId || null,
          editor: art.editor || '',
          featuredImage: art.featuredImage || '',
          imageCaption: art.imageCaption || '',
          imageAlt: art.imageAlt || '',
          status: art.status || 'published',
          readTime: '3 mnt baca',
          views: art.views || 0,
          tags: art.tags || [],
          isBreaking: false,
          isEditorPick: false,
          isTrending: false,
          isHeadline: art.isHeadline || false,
          headlinePosition: art.headlinePosition || null,
          headlineUntil: art.headlineUntil || null,
          ranking: 0,
          region: 'Batu',
          seoTitle: art.seoTitle || art.title,
          metaDescription: art.metaDescription || art.excerpt,
          canonicalUrl: art.canonicalUrl || `/berita/${art.slug}`,
          publishedAt: art.publishedAt || new Date().toISOString(),
          createdAt: art.createdAt || new Date().toISOString(),
          updatedAt: art.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Articles seeded: ${initialAdminArticles.length}`);

    // 7. Videos
    console.log('🎥 Seeding videos...');
    for (const vid of initialAdminVideos) {
      await db
        .insert(schema.videos)
        .values({
          id: vid.id,
          title: vid.title,
          slug: vid.slug,
          excerpt: vid.excerpt || '',
          description: vid.description || '',
          youtubeUrl: vid.youtubeUrl,
          youtubeVideoId: vid.youtubeVideoId,
          thumbnailSource: vid.thumbnailSource || 'youtube',
          customThumbnail: vid.customThumbnail || '',
          thumbnailMediaId: vid.thumbnailMediaId || '',
          duration: vid.duration || '00:00',
          category: vid.category,
          categorySlug: vid.categorySlug || 'liputan-khusus',
          author: vid.author || 'Redaksi Batu TV',
          authorId: vid.authorId || null,
          status: vid.status || 'published',
          views: vid.views || 0,
          tags: vid.tags || [],
          seoTitle: vid.seoTitle || vid.title,
          metaDescription: vid.metaDescription || vid.excerpt,
          canonicalUrl: vid.canonicalUrl || `/video/${vid.slug}`,
          publishedAt: vid.publishedAt || new Date().toISOString(),
          createdAt: vid.createdAt || new Date().toISOString(),
          updatedAt: vid.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Videos seeded: ${initialAdminVideos.length}`);

    // 8. Users
    console.log('👥 Seeding users...');
    for (const u of INITIAL_CMS_USERS) {
      await db
        .insert(schema.users)
        .values({
          id: u.id,
          fullName: u.fullName,
          username: u.username,
          email: u.email,
          password: u.password || 'BatuTV123!',
          role: u.role || 'admin',
          status: u.status || 'aktif',
          authorId: u.authorId || null,
          authorName: u.authorName || null,
          authorPosition: u.authorPosition || null,
          authorPhotoUrl: u.authorPhotoUrl || null,
          lastLogin: u.lastLogin || null,
          lastLoginDetails: (u.lastLoginDetails as any) || null,
          forcePasswordChange: u.forcePasswordChange || false,
          failedLoginAttempts: u.failedLoginAttempts || 0,
          sessionsCount: u.sessionsCount || 0,
          notes: u.notes || '',
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Users seeded: ${INITIAL_CMS_USERS.length}`);

    // 9. Navigation Items
    console.log('🧭 Seeding navigation items...');
    for (const nav of INITIAL_NAVIGATION_DATA) {
      await db
        .insert(schema.navigationItems)
        .values({
          id: nav.id,
          label: nav.label,
          type: nav.type || 'internal',
          targetType: nav.targetType || 'kategori',
          targetId: nav.targetId || '',
          url: nav.url,
          slug: nav.slug,
          parentId: nav.parentId || null,
          sortOrder: nav.sortOrder || 0,
          active: nav.active ?? true,
          openNewTab: nav.openNewTab ?? false,
          icon: nav.icon || '',
          createdAt: nav.createdAt || new Date().toISOString(),
          updatedAt: nav.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Navigation items seeded: ${INITIAL_NAVIGATION_DATA.length}`);

    // 10. Sub-Navigation Items
    console.log('🔖 Seeding sub-navigation items...');
    for (const snav of INITIAL_SUB_NAVIGATION_DATA) {
      await db
        .insert(schema.subNavigationItems)
        .values({
          id: snav.id,
          label: snav.label,
          targetType: snav.targetType || 'category',
          targetId: snav.targetId || '',
          url: snav.url,
          slug: snav.slug,
          sortOrder: snav.sortOrder || 0,
          active: snav.active ?? true,
          openNewTab: snav.openNewTab ?? false,
          badge: snav.badge || '',
          createdAt: snav.createdAt || new Date().toISOString(),
          updatedAt: snav.updatedAt || new Date().toISOString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Sub-Navigation items seeded: ${INITIAL_SUB_NAVIGATION_DATA.length}`);

    // 11. Site Settings
    console.log('⚙️  Seeding site settings...');
    await db
      .insert(schema.siteSettings)
      .values({
        id: 'current',
        identity: INITIAL_SITE_SETTINGS.identity as any,
        logos: INITIAL_SITE_SETTINGS.logos as any,
        favicon: INITIAL_SITE_SETTINGS.favicon as any,
        colors: INITIAL_SITE_SETTINGS.colors as any,
        typography: INITIAL_SITE_SETTINGS.typography as any,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    // 12. Footer Settings
    console.log('🦶 Seeding footer settings...');
    await db
      .insert(schema.footerSettings)
      .values({
        id: 'current',
        mediaInfo: INITIAL_FOOTER_CONFIG.mediaInfo as any,
        companyLinks: INITIAL_FOOTER_CONFIG.companyLinks as any,
        legalLinks: INITIAL_FOOTER_CONFIG.legalLinks as any,
        socialMedia: INITIAL_FOOTER_CONFIG.socialMedia as any,
        copyright: INITIAL_FOOTER_CONFIG.copyright as any,
        logo: INITIAL_FOOTER_CONFIG.logo as any,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    // 13. Sidebar Settings
    console.log('📐 Seeding sidebar settings...');
    await db
      .insert(schema.sidebarSettings)
      .values({
        id: 'current',
        homepageConfig: INITIAL_HOMEPAGE_SIDEBAR as any,
        articleConfig: INITIAL_ARTICLE_SIDEBAR as any,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    // 14. System Settings
    console.log('🔒 Seeding system settings...');
    await db
      .insert(schema.systemSettings)
      .values({
        id: 'current',
        general: DEFAULT_SYSTEM_INFO as any,
        email: {} as any,
        security: DEFAULT_SECURITY_CONFIG as any,
        media: {} as any,
        seo: DEFAULT_MAINTENANCE_CONFIG as any,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    console.log('\n🎉 ALL INITIAL DATA SEEDED SUCCESSFULLY INTO SUPABASE POSTGRESQL!\n');
  } catch (err: any) {
    console.error('❌ Seeder encountered an error:', err);
    throw err;
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith('seedPostgres.ts') || process.argv[1]?.includes('seedPostgres')) {
  runPostgresSeeder().catch(() => process.exit(1));
}
