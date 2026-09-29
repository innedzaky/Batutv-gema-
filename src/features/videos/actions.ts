'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminVideoSchema, AdminVideoFormValues, extractYouTubeId } from './schemas';
import { adminFirestoreVideoRepository } from './data/adminFirestoreVideoRepository';
import { getAdminAuth } from '@/src/lib/firebaseAdmin';
import { AdminVideo, VideoStatus } from '@/src/types/admin';

export interface VideoActionResult {
  success: boolean;
  message: string;
  video?: AdminVideo;
  errors?: Record<string, string[]>;
}

/**
 * Helper: Verifikasi sesi autentikasi server dan role pengguna
 */
async function verifyStaffSession(): Promise<{ uid: string; email: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) return null;

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = (decodedToken.role as string) || 'reporter';

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
    };
  } catch (err) {
    console.warn('[verifyStaffSession] Session verification error:', err);
    return null;
  }
}

/**
 * Server Action: Buat Video Baru
 */
export async function createVideoAction(
  values: AdminVideoFormValues
): Promise<VideoActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid atau telah berakhir. Harap login kembali.',
    };
  }

  const parsed = adminVideoSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validasi form video gagal. Periksa input yang ditandai.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Reporter hanya boleh membuat video berstatus draft
  let targetStatus: VideoStatus = data.status;
  if (staff.role === 'reporter' && targetStatus !== 'draft') {
    targetStatus = 'draft';
  }

  const nowIso = new Date().toISOString();
  const docId = data.id || `vid-${Date.now()}`;
  const youtubeId = data.youtubeVideoId || extractYouTubeId(data.youtubeUrl) || 'dQw4w9WgXcQ';

  const newVideo: AdminVideo = {
    id: docId,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    description: data.description,
    youtubeUrl: data.youtubeUrl,
    youtubeVideoId: youtubeId,
    thumbnailSource: data.thumbnailSource,
    customThumbnail: data.customThumbnail,
    thumbnailMediaId: data.thumbnailMediaId,
    customThumbnailAlt: data.customThumbnailAlt,
    customThumbnailCaption: data.customThumbnailCaption,
    duration: data.duration,
    category: data.category,
    categorySlug: data.categorySlug,
    author: data.author || staff.email,
    authorId: staff.uid,
    status: targetStatus,
    publishedAt: targetStatus === 'published' ? (data.publishedAt || nowIso) : nowIso,
    scheduledAt: data.scheduledAt || null,
    createdAt: nowIso,
    updatedAt: nowIso,
    seoTitle: data.seoTitle || data.title,
    metaDescription: data.metaDescription || data.excerpt,
    canonicalUrl: data.canonicalUrl || `https://batutv.id/video/${data.slug}`,
    views: 0,
    tags: data.tags,
  };

  try {
    const saved = await adminFirestoreVideoRepository.saveVideo(newVideo);

    revalidatePath('/video');
    revalidatePath('/batutv-control/videos');
    revalidatePath(`/video/${saved.slug}`);

    return {
      success: true,
      message: `Video "${saved.title}" berhasil disimpan (${saved.status}).`,
      video: saved,
    };
  } catch (err: any) {
    console.error('[createVideoAction] Error:', err);
    return {
      success: false,
      message: `Gagal menyimpan video: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Update Video
 */
export async function updateVideoAction(
  id: string,
  values: Partial<AdminVideoFormValues>
): Promise<VideoActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  try {
    const existing = await adminFirestoreVideoRepository.getVideoById(id);
    if (!existing) {
      return {
        success: false,
        message: `Video dengan ID ${id} tidak ditemukan.`,
      };
    }

    // Role check: Reporter hanya bisa edit video miliknya sendiri
    if (staff.role === 'reporter' && existing.authorId && existing.authorId !== staff.uid) {
      return {
        success: false,
        message: 'Akses ditolak: Reporter hanya dapat mengedit video buatannya sendiri.',
      };
    }

    // RBAC: Reporter TIDAK memiliki izin menerbitkan atau menjadwalkan video.
    // Jika reporter memotong form via DevTools/API dengan values.status !== 'draft', tolak secara tegas!
    if (staff.role === 'reporter' && values.status && values.status !== 'draft') {
      return {
        success: false,
        message: 'Akses ditolak: Reporter tidak memiliki izin untuk menerbitkan atau menjadwalkan video. Naskah harus berstatus Draft.',
      };
    }

    // Jika reporter mengedit, kunci status tetap draft kecuali sudah pernah disetujui (tetap tidak boleh mem-publish sendiri)
    const effectiveStatus: VideoStatus =
      staff.role === 'reporter' ? 'draft' : (values.status || existing.status);

    // Ekstrak youtube id jika url berubah
    const youtubeVideoId = values.youtubeUrl
      ? extractYouTubeId(values.youtubeUrl) || existing.youtubeVideoId
      : existing.youtubeVideoId;

    const mergedData: AdminVideo = {
      ...existing,
      ...values,
      status: effectiveStatus,
      youtubeVideoId: youtubeVideoId || existing.youtubeVideoId,
      updatedAt: new Date().toISOString(),
    };

    const updated = await adminFirestoreVideoRepository.saveVideo(mergedData);

    revalidatePath('/video');
    revalidatePath('/batutv-control/videos');
    revalidatePath(`/video/${updated.slug}`);
    if (existing.slug !== updated.slug) {
      revalidatePath(`/video/${existing.slug}`);
    }

    return {
      success: true,
      message: `Video "${updated.title}" berhasil diperbarui.`,
      video: updated,
    };
  } catch (err: any) {
    console.error('[updateVideoAction] Error:', err);
    return {
      success: false,
      message: `Gagal memperbarui video: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Hapus Video
 */
export async function deleteVideoAction(id: string): Promise<VideoActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  // Hanya Superadmin dan Editor yang boleh menghapus video
  if (staff.role !== 'superadmin' && staff.role !== 'editor') {
    return {
      success: false,
      message: 'Akses ditolak: Hanya Editor atau Superadmin yang berwenang menghapus video.',
    };
  }

  try {
    const existing = await adminFirestoreVideoRepository.getVideoById(id);
    await adminFirestoreVideoRepository.deleteVideo(id);

    revalidatePath('/video');
    revalidatePath('/batutv-control/videos');
    if (existing) {
      revalidatePath(`/video/${existing.slug}`);
    }

    return {
      success: true,
      message: `Video ${id} berhasil dihapus.`,
    };
  } catch (err: any) {
    console.error('[deleteVideoAction] Error:', err);
    return {
      success: false,
      message: `Gagal menghapus video: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Publikasikan Video Langsung
 */
export async function publishVideoAction(id: string): Promise<VideoActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  if (staff.role !== 'superadmin' && staff.role !== 'editor') {
    return {
      success: false,
      message: 'Akses ditolak: Hanya Editor atau Superadmin yang berwenang menerbitkan video.',
    };
  }

  try {
    const existing = await adminFirestoreVideoRepository.getVideoById(id);
    if (!existing) {
      return { success: false, message: `Video ${id} tidak ditemukan.` };
    }

    const updated = await adminFirestoreVideoRepository.saveVideo({
      ...existing,
      status: 'published',
      publishedAt: existing.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/video');
    revalidatePath('/batutv-control/videos');
    revalidatePath(`/video/${updated.slug}`);

    return {
      success: true,
      message: `Video "${updated.title}" berhasil dipublikasikan.`,
      video: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menerbitkan video: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Tarik Video dari Publikasi (Unpublish -> Draft)
 */
export async function unpublishVideoAction(id: string): Promise<VideoActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  if (staff.role !== 'superadmin' && staff.role !== 'editor') {
    return {
      success: false,
      message: 'Akses ditolak: Hanya Editor atau Superadmin yang berwenang membatalkan publikasi video.',
    };
  }

  try {
    const existing = await adminFirestoreVideoRepository.getVideoById(id);
    if (!existing) {
      return { success: false, message: `Video ${id} tidak ditemukan.` };
    }

    const updated = await adminFirestoreVideoRepository.saveVideo({
      ...existing,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/video');
    revalidatePath('/batutv-control/videos');
    revalidatePath(`/video/${updated.slug}`);

    return {
      success: true,
      message: `Video "${updated.title}" ditarik ke status Draft.`,
      video: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menarik video ke draft: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Pindahkan Video ke Sampah (Soft-Delete)
 */
export async function moveVideoToTrashAction(id: string): Promise<VideoActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  try {
    const existing = await adminFirestoreVideoRepository.getVideoById(id);
    if (!existing) {
      return { success: false, message: `Video ${id} tidak ditemukan.` };
    }

    // Role check: Reporter hanya boleh memasukkan video miliknya sendiri ke sampah
    if (staff.role === 'reporter' && existing.authorId && existing.authorId !== staff.uid) {
      return {
        success: false,
        message: 'Akses ditolak: Reporter tidak dapat memindahkan video milik staf lain ke sampah.',
      };
    }

    const updated = await adminFirestoreVideoRepository.saveVideo({
      ...existing,
      status: 'trash',
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/video');
    revalidatePath('/batutv-control/videos');
    revalidatePath(`/video/${updated.slug}`);

    return {
      success: true,
      message: `Video "${updated.title}" dipindahkan ke Sampah.`,
      video: updated,
    };
  } catch (err: any) {
    console.error('[moveVideoToTrashAction] Error:', err);
    return {
      success: false,
      message: `Gagal memindahkan video ke sampah: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Pulihkan Video dari Sampah (Restore -> Draft)
 */
export async function restoreVideoFromTrashAction(id: string): Promise<VideoActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  try {
    const existing = await adminFirestoreVideoRepository.getVideoById(id);
    if (!existing) {
      return { success: false, message: `Video ${id} tidak ditemukan.` };
    }

    // Role check: Reporter hanya boleh memulihkan video miliknya sendiri
    if (staff.role === 'reporter' && existing.authorId && existing.authorId !== staff.uid) {
      return {
        success: false,
        message: 'Akses ditolak: Reporter tidak dapat memulihkan video milik staf lain.',
      };
    }

    const updated = await adminFirestoreVideoRepository.saveVideo({
      ...existing,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/video');
    revalidatePath('/batutv-control/videos');
    revalidatePath(`/video/${updated.slug}`);

    return {
      success: true,
      message: `Video "${updated.title}" dipulihkan ke status Draft.`,
      video: updated,
    };
  } catch (err: any) {
    console.error('[restoreVideoFromTrashAction] Error:', err);
    return {
      success: false,
      message: `Gagal memulihkan video: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Hapus Video Permanen (Hard-Delete)
 */
export async function deleteVideoPermanentlyAction(id: string): Promise<VideoActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  // Hanya Superadmin dan Editor yang boleh menghapus video secara permanen
  if (staff.role !== 'superadmin' && staff.role !== 'editor') {
    return {
      success: false,
      message: 'Akses ditolak: Hanya Editor atau Superadmin yang berwenang menghapus permanen video.',
    };
  }

  try {
    const existing = await adminFirestoreVideoRepository.getVideoById(id);
    await adminFirestoreVideoRepository.deleteVideo(id);

    revalidatePath('/video');
    revalidatePath('/batutv-control/videos');
    if (existing) {
      revalidatePath(`/video/${existing.slug}`);
    }

    return {
      success: true,
      message: `Video ${id} berhasil dihapus permanen.`,
    };
  } catch (err: any) {
    console.error('[deleteVideoPermanentlyAction] Error:', err);
    return {
      success: false,
      message: `Gagal menghapus video permanen: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Ambil Data Seluruh Video untuk Panel Admin (dengan Penegakan RBAC)
 */
export async function getAdminVideosAction(options?: {
  status?: VideoStatus;
  category?: string;
  search?: string;
}): Promise<{
  success: boolean;
  message?: string;
  videos: AdminVideo[];
  currentUser: { uid: string; email: string; role: string } | null;
}> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid.',
      videos: [],
      currentUser: null,
    };
  }

  try {
    let allVideos = await adminFirestoreVideoRepository.getVideos({
      status: options?.status,
      categorySlug: options?.category,
    });

    if (options?.search) {
      const q = options.search.toLowerCase();
      allVideos = allVideos.filter(
        (v) => v.title.toLowerCase().includes(q) || (v.excerpt && v.excerpt.toLowerCase().includes(q))
      );
    }

    // RBAC: Reporter HANYA boleh melihat video yang ia buat sendiri (authorId === staff.uid)
    if (staff.role === 'reporter') {
      allVideos = allVideos.filter(
        (v) => !v.authorId || v.authorId === staff.uid || v.author === staff.email
      );
    }

    return {
      success: true,
      videos: allVideos,
      currentUser: staff,
    };
  } catch (err: any) {
    console.error('[getAdminVideosAction] Error:', err);
    return {
      success: false,
      message: `Gagal memuat video: ${err.message || String(err)}`,
      videos: [],
      currentUser: staff,
    };
  }
}
