'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminMedia, AdminUser } from '@/src/types/admin';
import { MediaManagementModule, MediaActions } from './MediaManagementModule';
import {
  deleteMediaAction,
  updateMediaMetadataAction,
  uploadMediaAction,
} from '@/src/features/media/actions';

interface AdminMediaClientWrapperProps {
  initialMedia: AdminMedia[];
  currentUser: AdminUser;
}

export function AdminMediaClientWrapper({
  initialMedia,
  currentUser,
}: AdminMediaClientWrapperProps) {
  const router = useRouter();

  const actions: MediaActions = {
    deleteMedia: deleteMediaAction,
    updateMetadata: updateMediaMetadataAction,
    uploadMedia: uploadMediaAction,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <MediaManagementModule
        onNavigateToPublic={(path) => router.push(path)}
        currentUser={currentUser}
        initialMedia={initialMedia}
        actions={actions}
      />
    </div>
  );
}
