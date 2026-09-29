'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminVideo, AdminUser } from '@/src/types/admin';
import { VideoManagementModule, VideoActions } from './VideoManagementModule';
import {
  createVideoAction,
  updateVideoAction,
  publishVideoAction,
  unpublishVideoAction,
  moveVideoToTrashAction,
  restoreVideoFromTrashAction,
  deleteVideoPermanentlyAction,
} from '@/src/features/videos/actions';

interface AdminVideosClientWrapperProps {
  initialVideos: AdminVideo[];
  currentUser: AdminUser;
}

export function AdminVideosClientWrapper({
  initialVideos,
  currentUser,
}: AdminVideosClientWrapperProps) {
  const router = useRouter();

  const actions: VideoActions = {
    createVideo: createVideoAction,
    updateVideo: updateVideoAction,
    publishVideo: publishVideoAction,
    unpublishVideo: unpublishVideoAction,
    moveToTrash: moveVideoToTrashAction,
    restoreFromTrash: restoreVideoFromTrashAction,
    deletePermanently: deleteVideoPermanentlyAction,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <VideoManagementModule
        currentPath="/batutv-control/videos"
        onNavigate={(path) => router.push(path)}
        onNavigateToPublic={(slug) => router.push(`/video/${slug}`)}
        currentUser={currentUser}
        initialVideos={initialVideos}
        actions={actions}
      />
    </div>
  );
}
