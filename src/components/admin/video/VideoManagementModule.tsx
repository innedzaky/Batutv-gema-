import React, { useState, useEffect, useCallback } from 'react';
import { AdminVideo, VideoStatus, AdminUser } from '../../../types/admin';
import {
  getStoredVideos,
  persistVideo,
  moveVideoToTrash,
  restoreVideoFromTrash,
  deleteVideoPermanently,
  duplicateVideo,
  bulkUpdateVideoStatus,
  bulkPermanentDeleteVideos,
} from '../../../data/videoAdminStore';
import { canRolePublish, canRolePermanentDelete, canRoleTrashPublished } from '../../../utils/rbac';
import { VideoListView } from './VideoListView';
import { VideoEditorView } from './VideoEditorView';
import { VideoToast, VideoToastMessage } from './VideoToast';

export interface VideoActions {
  createVideo?: (input: any) => Promise<{ success: boolean; message: string; video?: any }>;
  updateVideo?: (id: string, input: any) => Promise<{ success: boolean; message: string; video?: any }>;
  publishVideo?: (id: string) => Promise<{ success: boolean; message: string }>;
  unpublishVideo?: (id: string) => Promise<{ success: boolean; message: string }>;
  moveToTrash?: (id: string) => Promise<{ success: boolean; message: string }>;
  restoreFromTrash?: (id: string) => Promise<{ success: boolean; message: string }>;
  deletePermanently?: (id: string) => Promise<{ success: boolean; message: string }>;
}

interface VideoManagementModuleProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onNavigateToPublic?: (slug: string) => void;
  currentUser?: AdminUser | null;
  initialVideos?: AdminVideo[];
  actions?: VideoActions;
}

export const VideoManagementModule: React.FC<VideoManagementModuleProps> = ({
  currentPath = '/batutv-control/videos',
  onNavigate,
  onNavigateToPublic,
  currentUser,
  initialVideos,
  actions,
}) => {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingVideo, setEditingVideo] = useState<AdminVideo | null>(null);

  // Videos List State - prioritize initialVideos if provided
  const [videos, setVideos] = useState<AdminVideo[]>(() => {
    if (initialVideos && initialVideos.length > 0) return initialVideos;
    return getStoredVideos();
  });

  // Toasts State
  const [toasts, setToasts] = useState<VideoToastMessage[]>([]);

  // Load videos on mount and path change
  const refreshVideos = useCallback(() => {
    const list = getStoredVideos();
    setVideos(list);
  }, []);

  useEffect(() => {
    if (initialVideos && initialVideos.length > 0) {
      setVideos(initialVideos);
    } else {
      refreshVideos();
    }
  }, [currentPath, initialVideos, refreshVideos]);

  // Routing detection based on currentPath
  const isTambahRoute =
    currentPath === '/batutv-control/video/tambah' ||
    currentPath === '/batutv-control/videos/tambah';
  const isEditRoute =
    currentPath.startsWith('/batutv-control/video/edit') ||
    currentPath.startsWith('/batutv-control/videos/edit');

  useEffect(() => {
    if (isEditRoute) {
      const parts = currentPath.split('/edit/');
      const editId = parts[1];
      if (editId) {
        const found = getStoredVideos().find((v) => v.id === editId);
        if (found) {
          setEditingVideo(found);
          setCurrentView('edit');
        }
      }
    } else if (isTambahRoute) {
      setEditingVideo(null);
      setCurrentView('create');
    } else {
      setEditingVideo(null);
      setCurrentView('list');
    }
  }, [currentPath, isEditRoute, isTambahRoute]);

  // Compute active tab from current route URL
  const activeTab: 'all' | 'draft' | 'scheduled' | 'published' | 'trash' = (() => {
    if (currentPath.includes('/draft')) return 'draft';
    if (currentPath.includes('/terbit')) return 'published';
    if (currentPath.includes('/terjadwal')) return 'scheduled';
    if (currentPath.includes('/sampah')) return 'trash';
    return 'all';
  })();

  const basePath = '/batutv-control/videos';

  const handleTabChange = (tab: 'all' | 'draft' | 'scheduled' | 'published' | 'trash') => {
    if (onNavigate) {
      if (tab === 'all') onNavigate(basePath);
      else if (tab === 'draft') onNavigate(`${basePath}/draft`);
      else if (tab === 'scheduled') onNavigate(`${basePath}/terjadwal`);
      else if (tab === 'published') onNavigate(`${basePath}/terbit`);
      else if (tab === 'trash') onNavigate(`${basePath}/sampah`);
    }
  };

  // Toast Helper
  const addToast = (
    type: 'success' | 'error' | 'info' | 'trash',
    title: string,
    message?: string,
    onUndo?: () => void
  ) => {
    const newToast: VideoToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      onUndo,
    };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // RBAC filter for Tab Counts
  const visibleVideos = React.useMemo(() => {
    if (currentUser?.role === 'reporter') {
      return videos.filter(
        (v) =>
          !v.authorId ||
          v.authorId === currentUser.id ||
          v.author === currentUser.name ||
          v.author === currentUser.email
      );
    }
    return videos;
  }, [videos, currentUser]);

  // Counts for Tabs & Badges
  const counts = {
    all: visibleVideos.filter((v) => v.status !== 'trash').length,
    draft: visibleVideos.filter((v) => v.status === 'draft').length,
    scheduled: visibleVideos.filter((v) => v.status === 'scheduled').length,
    published: visibleVideos.filter((v) => v.status === 'published').length,
    trash: visibleVideos.filter((v) => v.status === 'trash').length,
  };

  // Handlers
  const handleNewVideo = () => {
    setEditingVideo(null);
    if (onNavigate) {
      onNavigate(`${basePath}/tambah`);
    } else {
      setCurrentView('create');
    }
  };

  const handleEditVideo = (video: AdminVideo) => {
    setEditingVideo(video);
    if (onNavigate) {
      onNavigate(`${basePath}/edit/${video.id}`);
    } else {
      setCurrentView('edit');
    }
  };

  const handleCancelEditor = () => {
    setEditingVideo(null);
    if (onNavigate) {
      onNavigate(basePath);
    } else {
      setCurrentView('list');
    }
  };

  const handleSaveVideo = async (savedVideo: AdminVideo) => {
    const userRole = currentUser?.role;
    const canPublish = canRolePublish(userRole);

    let normalizedStatus = savedVideo.status;
    if (!canPublish && (savedVideo.status === 'published' || savedVideo.status === 'scheduled')) {
      normalizedStatus = 'draft';
      addToast(
        'info',
        'Naskah Video Dikirim ke Redaksi',
        'Role Reporter/Kontributor tidak memiliki izin terbit langsung. Video tersimpan sebagai Draft untuk ditinjau Editor/Redaksi.'
      );
    }

    const videoToSave = {
      ...savedVideo,
      status: normalizedStatus,
      authorId: savedVideo.authorId || currentUser?.id || 'usr-staff',
      author: savedVideo.author || currentUser?.name || 'Staf BatuTV',
    };

    const isNew = !editingVideo;

    // Optimistic cache update
    const updated = persistVideo(videoToSave, userRole);
    setVideos(updated);
    setEditingVideo(null);

    // Call Server Action asynchronously if provided
    try {
      if (isNew && actions?.createVideo) {
        await actions.createVideo(videoToSave as any);
      } else if (!isNew && actions?.updateVideo) {
        await actions.updateVideo(videoToSave.id, videoToSave as any);
      }
    } catch (err) {
      console.warn('[handleSaveVideo] Server Action sync note:', err);
    }

    const statusText =
      videoToSave.status === 'published'
        ? 'Diterbitkan'
        : videoToSave.status === 'scheduled'
        ? 'Dijadwalkan'
        : 'Disimpan sebagai Draft';

    if (canPublish || normalizedStatus === 'draft') {
      addToast(
        'success',
        isNew ? 'Video Berhasil Ditambahkan' : 'Video Berhasil Diperbarui',
        `"${videoToSave.title.slice(0, 45)}..." ${statusText}.`
      );
    }

    if (onNavigate) {
      if (videoToSave.status === 'published') onNavigate(`${basePath}/terbit`);
      else if (videoToSave.status === 'scheduled') onNavigate(`${basePath}/terjadwal`);
      else if (videoToSave.status === 'draft') onNavigate(`${basePath}/draft`);
      else onNavigate(basePath);
    } else {
      setCurrentView('list');
    }
  };

  const handleTrashVideo = (id: string) => {
    const target = videos.find((v) => v.id === id);
    const userRole = currentUser?.role;

    if (userRole === 'reporter' && target?.authorId && target.authorId !== currentUser?.id) {
      addToast(
        'error',
        'Aksi Tidak Diizinkan',
        'Reporter hanya dapat memindahkan video buatannya sendiri ke sampah.'
      );
      return;
    }

    if (target && target.status === 'published' && !canRoleTrashPublished(userRole)) {
      addToast(
        'error',
        'Aksi Tidak Diizinkan',
        'Hanya Admin, Redaksi, dan Editor yang dapat memindahkan video terbit ke sampah.'
      );
      return;
    }

    const updated = moveVideoToTrash(id, userRole);
    setVideos(updated);
    if (actions?.moveToTrash) actions.moveToTrash(id).catch(console.error);

    addToast(
      'trash',
      'Video Dipindahkan ke Sampah',
      target ? `"${target.title.slice(0, 40)}..." masuk ke tab Sampah.` : undefined,
      () => {
        const restored = restoreVideoFromTrash(id);
        setVideos(restored);
        if (actions?.restoreFromTrash) actions.restoreFromTrash(id).catch(console.error);
        addToast('success', 'Video Dipulihkan', 'Video dikembalikan ke status Draft.');
      }
    );
  };

  const handleRestoreVideo = (id: string) => {
    const updated = restoreVideoFromTrash(id);
    setVideos(updated);
    if (actions?.restoreFromTrash) actions.restoreFromTrash(id).catch(console.error);
    addToast('success', 'Video Dipulihkan', 'Video dikembalikan ke tab Draft.');
  };

  const handlePermanentDelete = (id: string) => {
    const userRole = currentUser?.role;
    if (!canRolePermanentDelete(userRole)) {
      addToast(
        'error',
        'Akses Ditolak (403)',
        'Hanya Super Admin yang berwenang menghapus video secara permanen.'
      );
      return;
    }

    const updated = deleteVideoPermanently(id, userRole);
    setVideos(updated);
    if (actions?.deletePermanently) actions.deletePermanently(id).catch(console.error);
    addToast('info', 'Video Dihapus Permanen', 'Video telah dihapus dari sistem.');
  };

  const handleDuplicateVideo = (id: string) => {
    const { updatedVideos, newVideo } = duplicateVideo(id);
    setVideos(updatedVideos);
    if (newVideo) {
      addToast(
        'success',
        'Video Berhasil Diduplikasi',
        `Salinan dibuat: "${newVideo.title.slice(0, 40)}..." (Status: Draft)`
      );
    }
  };

  const handleQuickStatusChange = (id: string, newStatus: VideoStatus) => {
    const userRole = currentUser?.role;
    if (newStatus === 'published' && !canRolePublish(userRole)) {
      addToast(
        'error',
        'Akses Ditolak',
        'Role Anda tidak memiliki wewenang untuk menerbitkan video secara langsung.'
      );
      return;
    }

    const updated = bulkUpdateVideoStatus([id], newStatus, userRole);
    setVideos(updated);

    if (newStatus === 'published' && actions?.publishVideo) {
      actions.publishVideo(id).catch(console.error);
    } else if (newStatus === 'draft' && actions?.unpublishVideo) {
      actions.unpublishVideo(id).catch(console.error);
    }

    addToast(
      'success',
      'Status Video Diperbarui',
      `Status video diubah menjadi: ${newStatus === 'published' ? 'Terbit' : 'Draft'}.`
    );
  };

  const handleBulkStatusChange = (ids: string[], newStatus: VideoStatus) => {
    const userRole = currentUser?.role;
    if (newStatus === 'published' && !canRolePublish(userRole)) {
      addToast(
        'error',
        'Akses Ditolak',
        'Role Anda tidak memiliki wewenang untuk menerbitkan video secara massal.'
      );
      return;
    }

    const updated = bulkUpdateVideoStatus(ids, newStatus, userRole);
    setVideos(updated);
    addToast(
      'success',
      'Perubahan Massal Berhasil',
      `${ids.length} video diubah statusnya menjadi ${newStatus}.`
    );
  };

  const handleBulkPermanentDelete = (ids: string[]) => {
    const userRole = currentUser?.role;
    if (!canRolePermanentDelete(userRole)) {
      addToast(
        'error',
        'Akses Ditolak (403)',
        'Hanya Super Admin yang berwenang melakukan penghapusan massal permanen.'
      );
      return;
    }

    const updated = bulkPermanentDeleteVideos(ids, userRole);
    setVideos(updated);
    addToast(
      'info',
      'Penghapusan Massal Selesai',
      `${ids.length} video telah dihapus permanen dari sistem.`
    );
  };

  const handleNavigateToPublicPage = (slug: string) => {
    if (onNavigateToPublic) {
      onNavigateToPublic(slug);
    } else {
      window.location.href = `/video/${slug}`;
    }
  };

  return (
    <div className="relative">
      {/* Toast Notifications */}
      <VideoToast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Dynamic View Router */}
      {currentView === 'list' && (
        <VideoListView
          videos={videos}
          activeTab={activeTab}
          counts={counts}
          currentUser={currentUser}
          onTabChange={handleTabChange}
          onNewVideo={handleNewVideo}
          onEditVideo={handleEditVideo}
          onTrashVideo={handleTrashVideo}
          onRestoreVideo={handleRestoreVideo}
          onPermanentDelete={handlePermanentDelete}
          onDuplicateVideo={handleDuplicateVideo}
          onQuickStatusChange={handleQuickStatusChange}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkPermanentDelete={handleBulkPermanentDelete}
          onNavigateToPublic={handleNavigateToPublicPage}
        />
      )}

      {(currentView === 'create' || currentView === 'edit') && (
        <VideoEditorView
          initialVideo={editingVideo}
          currentUser={currentUser}
          onSave={handleSaveVideo}
          onCancel={handleCancelEditor}
          onPreviewPublic={handleNavigateToPublicPage}
        />
      )}
    </div>
  );
};
