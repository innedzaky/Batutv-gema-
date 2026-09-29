import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/src/lib/firebaseAdmin';
import { SESSION_COOKIE_NAME } from '@/src/features/auth/types';
import { AdminUser, AdminRole } from '@/src/types/admin';
import { adminFirestoreVideoRepository } from '@/src/features/videos/data/adminFirestoreVideoRepository';
import { AdminVideosClientWrapper } from '@/src/components/admin/video/AdminVideosClientWrapper';

export const metadata = {
  title: 'Manajemen Video & VOD - BatuTV Control Panel',
  description: 'Pusat Manajemen Konten Video, Siaran Digital, Liputan Khusus, dan Arsip BatuTV.',
};

/**
 * Server Component untuk /batutv-control/videos
 *
 * Dilindungi Guard 3-Lapis:
 * 1. Middleware Fast-Reject
 * 2. Root Dashboard Layout Cryptographic Verification (checkRevoked: true)
 * 3. Server Component Route Verification & Role-Based Data Isolation (Reporter vs Editor/Superadmin)
 */
export default async function AdminVideosDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/login?redirect=/batutv-control/videos');
  }

  let decodedToken: any = null;
  try {
    const adminAuth = getAdminAuth();
    decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/login?redirect=/batutv-control/videos');
  }

  if (!decodedToken || !decodedToken.uid) {
    redirect('/login?redirect=/batutv-control/videos');
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

  // Ambil data video dari Firestore
  let videos = await adminFirestoreVideoRepository.getVideos();

  // RBAC Penegakan Level Server:
  // Reporter HANYA menerima video miliknya sendiri (authorId === uid)
  if (role === 'reporter') {
    videos = videos.filter(
      (v) => !v.authorId || v.authorId === currentUser.id || v.author === currentUser.email
    );
  }

  return (
    <AdminVideosClientWrapper
      initialVideos={videos}
      currentUser={currentUser}
    />
  );
}
