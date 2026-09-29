import { getAdminFirestore } from '@/src/lib/firebaseAdmin';
import { AdminMedia, MediaType } from '@/src/types/admin';
import { IMediaRepository } from '@/src/repositories/IMediaRepository';
import { initialAdminMedia } from '@/src/data/mediaAdminDummyData';
import { sanitizeForFirestore } from '@/src/repositories/firestore/converterUtils';

const COLLECTION_NAME = 'media';

export function toMediaDoc(media: AdminMedia): Record<string, any> {
  return sanitizeForFirestore({
    id: media.id,
    filename: media.filename,
    originalName: media.originalName,
    mimeType: media.mimeType || 'image/jpeg',
    extension: media.extension || 'jpg',
    mediaType: media.mediaType || 'image',
    width: media.width || 0,
    height: media.height || 0,
    fileSize: media.fileSize || 0,
    altText: media.altText || '',
    caption: media.caption || '',
    description: media.description || '',
    url: media.url || '',
    sizes: media.sizes || {},
    usageCount: media.usageCount ?? 0,
    usedIn: media.usedIn || [],
    createdAt: media.createdAt || new Date().toISOString(),
    updatedAt: media.updatedAt || new Date().toISOString(),
  });
}

export function fromMediaDoc(id: string, data: Record<string, any>): AdminMedia {
  const filename = data.filename || data.fileName || '';
  const mediaType = (data.mediaType || (data.mimeType?.startsWith('image/') ? 'image' : 'document')) as MediaType;

  return {
    id: data.id || id,
    filename,
    originalName: data.originalName || filename,
    mimeType: data.mimeType || 'image/jpeg',
    extension: data.extension || 'jpg',
    mediaType: mediaType || 'image',
    width: Number(data.width) || 0,
    height: Number(data.height) || 0,
    fileSize: Number(data.fileSize) || 0,
    altText: data.altText || '',
    caption: data.caption || '',
    description: data.description || '',
    url: data.url || '',
    sizes: data.sizes || {},
    usageCount: Number(data.usageCount) || 0,
    usedIn: Array.isArray(data.usedIn) ? data.usedIn : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export class AdminFirestoreMediaRepository implements IMediaRepository {
  async getAll(filter?: { mediaType?: MediaType; search?: string }): Promise<AdminMedia[]> {
    try {
      const adminDb = getAdminFirestore();
      let queryRef: FirebaseFirestore.Query = adminDb.collection(COLLECTION_NAME);

      if (filter?.mediaType) {
        queryRef = queryRef.where('mediaType', '==', filter.mediaType);
      }

      queryRef = queryRef.orderBy('createdAt', 'desc');

      const snap = await queryRef.get();
      let list: AdminMedia[] = [];

      snap.forEach((docSnap) => {
        list.push(fromMediaDoc(docSnap.id, docSnap.data()));
      });

      if (filter?.search) {
        const term = filter.search.toLowerCase();
        list = list.filter(
          (m) =>
            m.originalName.toLowerCase().includes(term) ||
            m.altText.toLowerCase().includes(term) ||
            m.caption.toLowerCase().includes(term) ||
            m.filename.toLowerCase().includes(term)
        );
      }

      if (list.length > 0) {
        return list;
      }
    } catch (err: any) {
      console.warn(`[AdminFirestoreMediaRepository] getAll error (${err.message}). Using fallback.`);
    }

    // Fallback dummy data
    let fallback = [...initialAdminMedia];
    if (filter?.mediaType) {
      fallback = fallback.filter((m) => m.mediaType === filter.mediaType);
    }
    if (filter?.search) {
      const term = filter.search.toLowerCase();
      fallback = fallback.filter(
        (m) =>
          m.originalName.toLowerCase().includes(term) ||
          m.altText.toLowerCase().includes(term) ||
          m.caption.toLowerCase().includes(term) ||
          m.filename.toLowerCase().includes(term)
      );
    }
    return fallback;
  }

  async getById(id: string): Promise<AdminMedia | null> {
    try {
      const adminDb = getAdminFirestore();
      const docSnap = await adminDb.collection(COLLECTION_NAME).doc(id).get();
      if (docSnap.exists) {
        return fromMediaDoc(docSnap.id, docSnap.data()!);
      }
    } catch (err: any) {
      console.warn(`[AdminFirestoreMediaRepository] getById error (${err.message}).`);
    }

    const fallback = initialAdminMedia.find((m) => m.id === id);
    return fallback || null;
  }

  async create(media: AdminMedia): Promise<AdminMedia> {
    const adminDb = getAdminFirestore();
    const docId = media.id || `med-${Date.now()}`;
    const mediaToSave: AdminMedia = {
      ...media,
      id: docId,
      createdAt: media.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docData = toMediaDoc(mediaToSave);
    await adminDb.collection(COLLECTION_NAME).doc(docId).set(docData, { merge: true });
    return mediaToSave;
  }

  async update(id: string, partial: Partial<AdminMedia>): Promise<AdminMedia> {
    const adminDb = getAdminFirestore();
    const docRef = adminDb.collection(COLLECTION_NAME).doc(id);
    const existing = await this.getById(id);

    const merged: AdminMedia = {
      ...(existing || ({} as AdminMedia)),
      ...partial,
      id,
      updatedAt: new Date().toISOString(),
    };

    const docData = toMediaDoc(merged);
    await docRef.set(docData, { merge: true });
    return merged;
  }

  async delete(id: string): Promise<void> {
    const adminDb = getAdminFirestore();
    await adminDb.collection(COLLECTION_NAME).doc(id).delete();
  }

  async bulkDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const adminDb = getAdminFirestore();
    const batch = adminDb.batch();

    for (const id of ids) {
      const docRef = adminDb.collection(COLLECTION_NAME).doc(id);
      batch.delete(docRef);
    }

    await batch.commit();
    return ids.length;
  }

  subscribe(
    _onNext: (mediaList: AdminMedia[]) => void,
    _onError?: (error: Error) => void
  ): () => void {
    // Server-side Admin SDK tidak membutuhkan persistent client onSnapshot listener
    return () => {};
  }
}

export const adminFirestoreMediaRepository = new AdminFirestoreMediaRepository();
