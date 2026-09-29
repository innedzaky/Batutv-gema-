import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/src/lib/firebaseAdmin';
import { SESSION_COOKIE_NAME } from '@/src/features/auth/types';
import { AdminUser, AdminRole } from '@/src/types/admin';
import { adminFirestoreMediaRepository } from '@/src/features/media/data/adminFirestoreMediaRepository';
import { AdminMediaClientWrapper } from '@/src/components/admin/media/AdminMediaClientWrapper';

export const metadata = {
  title: 'Media Library & Pustaka Aset - BatuTV Control Panel',
  description: 'Pusat Manajemen Berkas Foto, Grafis Liputan, dan Aset Visual Redaksi Portal Berita BatuTV.',
};

/**
 * Server Component untuk /batutv-control/media
 *
 * Dilindungi Guard 3-Lapis:
 * 1. Middleware Fast-Reject
 * 2. Root Dashboard Layout Cryptographic Verification (checkRevoked: true)
 * 3. Server Component Route Verification
 */
export default async function AdminMediaDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/login?redirect=/batutv-control/media');
  }

  let decodedToken: any = null;
  try {
    const adminAuth = getAdminAuth();
    decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/login?redirect=/batutv-control/media');
  }

  if (!decodedToken || !decodedToken.uid) {
    redirect('/login?redirect=/batutv-control/media');
  }

  const role = ((decodedToken.role as string) || 'reporter') as AdminRole;
  const currentUser: AdminUser = {
    id: decodedToken.uid,
    name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Staf BatuTV'),
    email: decodedToken.email || '',
    role,
    status: 'active',
    avatarUrl: decodedToken.picture || '',
    createdAt: new Date().toISOString(),
  };

  // Ambil data media dari Firestore
  const mediaList = await adminFirestoreMediaRepository.getAll();

  return (
    <AdminMediaClientWrapper
      initialMedia={mediaList}
      currentUser={currentUser}
    />
  );
}
