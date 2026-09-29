'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getAdminAuth } from '@/src/lib/firebaseAdmin';
import { AdminMedia, MediaType } from '@/src/types/admin';
import { adminMediaSchema, AdminMediaInput, updateMediaMetadataSchema, UpdateMediaMetadataInput } from './schemas';
import { adminFirestoreMediaRepository } from './data/adminFirestoreMediaRepository';

export interface MediaActionResult {
  success: boolean;
  message: string;
  media?: AdminMedia;
  errors?: Record<string, string[]>;
}

/**
 * Helper: Verifikasi sesi staf
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
 * Server Action: Unggah & Daftarkan Media Baru
 */
export async function uploadMediaAction(input: AdminMediaInput): Promise<MediaActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid atau telah berakhir. Harap login kembali.',
    };
  }

  const parsed = adminMediaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validasi data media gagal.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const nowIso = new Date().toISOString();
  const docId = data.id || `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newMedia: AdminMedia = {
    id: docId,
    filename: data.filename,
    originalName: data.originalName,
    mimeType: data.mimeType,
    extension: data.extension,
    mediaType: data.mediaType as MediaType,
    width: data.width,
    height: data.height,
    fileSize: data.fileSize,
    altText: data.altText || data.originalName,
    caption: data.caption,
    description: data.description,
    url: data.url,
    sizes: data.sizes,
    usageCount: 0,
    usedIn: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    const saved = await adminFirestoreMediaRepository.create(newMedia);
    revalidatePath('/batutv-control/media');

    return {
      success: true,
      message: `Media "${saved.filename}" berhasil didaftarkan ke Pustaka Media.`,
      media: saved,
    };
  } catch (err: any) {
    console.error('[uploadMediaAction] Error:', err);
    return {
      success: false,
      message: `Gagal menyimpan berkas media: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Perbarui Metadata Media (Alt Text, Caption, Deskripsi)
 */
export async function updateMediaMetadataAction(
  id: string,
  input: UpdateMediaMetadataInput
): Promise<MediaActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  const parsed = updateMediaMetadataSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validasi metadata media gagal.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const existing = await adminFirestoreMediaRepository.getById(id);
    if (!existing) {
      return {
        success: false,
        message: `Media ${id} tidak ditemukan.`,
      };
    }

    const updated = await adminFirestoreMediaRepository.update(id, {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/batutv-control/media');

    return {
      success: true,
      message: `Metadata media "${updated.filename}" berhasil diperbarui.`,
      media: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal memperbarui metadata: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Hapus Media Tunggal
 */
export async function deleteMediaAction(id: string): Promise<MediaActionResult> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid. Harap login kembali.',
    };
  }

  // Hanya Superadmin dan Editor yang berwenang menghapus aset media
  if (staff.role !== 'superadmin' && staff.role !== 'editor') {
    return {
      success: false,
      message: 'Akses ditolak: Hanya Editor atau Superadmin yang berwenang menghapus berkas media.',
    };
  }

  try {
    const existing = await adminFirestoreMediaRepository.getById(id);
    if (!existing) {
      return {
        success: false,
        message: `Media ${id} tidak ditemukan.`,
      };
    }

    // Cek jika aset masih digunakan di artikel/video
    if (existing.usageCount && existing.usageCount > 0) {
      return {
        success: false,
        message: `Tidak dapat menghapus: Berkas media ini sedang digunakan di ${existing.usageCount} artikel/video aktif.`,
      };
    }

    await adminFirestoreMediaRepository.delete(id);
    revalidatePath('/batutv-control/media');

    return {
      success: true,
      message: `Media "${existing.filename}" berhasil dihapus dari sistem.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghapus media: ${err.message || String(err)}`,
    };
  }
}

/**
 * Server Action: Hapus Banyak Media Sekaligus (Bulk Delete)
 */
export async function bulkDeleteMediaAction(ids: string[]): Promise<{
  success: boolean;
  message: string;
  deletedCount: number;
}> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      message: 'Sesi login tidak valid.',
      deletedCount: 0,
    };
  }

  if (staff.role !== 'superadmin' && staff.role !== 'editor') {
    return {
      success: false,
      message: 'Akses ditolak: Hanya Editor atau Superadmin yang berwenang menghapus banyak media.',
      deletedCount: 0,
    };
  }

  try {
    const deletedCount = await adminFirestoreMediaRepository.bulkDelete(ids);
    revalidatePath('/batutv-control/media');

    return {
      success: true,
      message: `${deletedCount} berkas media berhasil dihapus permanen.`,
      deletedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghapus media secara massal: ${err.message || String(err)}`,
      deletedCount: 0,
    };
  }
}

/**
 * Server Action: Ambil Seluruh Data Media
 */
export async function getAdminMediaAction(filter?: {
  mediaType?: MediaType;
  search?: string;
}): Promise<{
  success: boolean;
  media: AdminMedia[];
  message?: string;
}> {
  const staff = await verifyStaffSession();
  if (!staff) {
    return {
      success: false,
      media: [],
      message: 'Sesi login tidak valid.',
    };
  }

  try {
    const list = await adminFirestoreMediaRepository.getAll(filter);
    return {
      success: true,
      media: list,
    };
  } catch (err: any) {
    return {
      success: false,
      media: [],
      message: `Gagal memuat media: ${err.message || String(err)}`,
    };
  }
}
