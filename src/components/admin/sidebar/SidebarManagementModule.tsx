import React, { useState, useEffect } from 'react';
import {
  PanelRight,
  Layout,
  Save,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Flame,
  Hash,
  Sparkles,
  Video,
  FileText,
  AlertCircle,
  ExternalLink,
  Eye,
  Info,
  Sliders,
  Image as ImageIcon,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  GlobalSidebarSettings,
  HomepageSidebarConfig,
  ArticleSidebarConfig,
  VideoSidebarConfig,
} from '../../../types/sidebar';
import {
  getStoredSidebarSettings,
  saveSidebarSettings,
  resetSidebarSettings,
  INITIAL_SIDEBAR_SETTINGS,
} from '../../../data/sidebarAdminStore';
import { MediaPickerModal } from '../media/MediaPickerModal';
import { AdminMedia } from '../../../types/admin';

interface SidebarManagementModuleProps {
  onNavigateToPublic?: (path: string) => void;
}

type TabType = 'homepage' | 'article' | 'video' | 'info_pages';

export const SidebarManagementModule: React.FC<SidebarManagementModuleProps> = ({
  onNavigateToPublic,
}) => {
  const [settings, setSettings] = useState<GlobalSidebarSettings>(() => getStoredSidebarSettings());
  const [activeTab, setActiveTab] = useState<TabType>('homepage');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);

  // Auto-hide success toast after 3 seconds
  useEffect(() => {
    if (isSaved) {
      const timer = setTimeout(() => setIsSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveSidebarSettings(settings);
    setIsSaving(false);
    setIsSaved(true);
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan seluruh konfigurasi sidebar ke pengaturan bawaan?')) {
      const reset = resetSidebarSettings();
      setSettings(reset);
      setIsSaved(true);
    }
  };

  // Updaters for homepage
  const updateHomepage = <K extends keyof HomepageSidebarConfig>(
    key: K,
    value: HomepageSidebarConfig[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        [key]: value,
      },
    }));
  };

  // Updaters for article
  const updateArticle = <K extends keyof ArticleSidebarConfig>(
    key: K,
    value: ArticleSidebarConfig[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      article: {
        ...prev.article,
        [key]: value,
      },
    }));
  };

  // Updaters for video
  const updateVideo = <K extends keyof VideoSidebarConfig>(
    key: K,
    value: VideoSidebarConfig[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      video: {
        ...prev.video,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 rounded-md">
              MASTER DATA
            </span>
            <span className="text-xs text-slate-400 font-medium">• Pengaturan Tata Letak Kolom Kanan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2.5">
            <PanelRight className="w-6 h-6 text-red-600" />
            Pengaturan Sidebar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola komponen, widget berita, iklan, dan urutan pada sidebar halaman Beranda, Artikel Berita, dan Video.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            title="Reset Pengaturan ke Default"
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {isSaved && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Pengaturan sidebar berhasil disimpan dan langsung diterapkan ke portal publik!</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSaved(false)}
            className="text-emerald-600 hover:text-emerald-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Navigation Tabs for Page Specific Sidebars */}
      <div className="flex border-b border-slate-200 bg-white px-3 sm:px-6 pt-2 rounded-2xl border shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('homepage')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'homepage'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Sidebar Beranda (Homepage)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('article')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'article'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Sidebar Halaman Artikel (Berita)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'video'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Sidebar Halaman Video</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info_pages')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'info_pages'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Halaman Informasi</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HOMEPAGE SIDEBAR SETTINGS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'homepage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* General Behavior Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                Perilaku Kolom Beranda
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Aktifkan Sidebar Beranda</p>
                    <p className="text-[11px] text-slate-500">Tampilkan kolom kanan di beranda portal</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.homepage.enabled}
                      onChange={(e) => updateHomepage('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Sticky Scroll (Melayang)</p>
                    <p className="text-[11px] text-slate-500">Sidebar tetap terlihat saat halaman digulir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.homepage.sticky}
                      onChange={(e) => updateHomepage('sticky', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Widget 1: Berita Terpopuler */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">
                    01
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Berita Terpopuler</h3>
                    <p className="text-[11px] text-slate-500">Badge nomor urut ranking artikel dengan view tertinggi</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepage.popularWidget.enabled}
                    onChange={(e) =>
                      updateHomepage('popularWidget', {
                        ...settings.homepage.popularWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.homepage.popularWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Header Widget
                    </label>
                    <input
                      type="text"
                      value={settings.homepage.popularWidget.title}
                      onChange={(e) =>
                        updateHomepage('popularWidget', {
                          ...settings.homepage.popularWidget,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maksimal Jumlah Berita Ditampilkan
                    </label>
                    <select
                      value={settings.homepage.popularWidget.limit}
                      onChange={(e) =>
                        updateHomepage('popularWidget', {
                          ...settings.homepage.popularWidget,
                          limit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      <option value={3}>3 Berita</option>
                      <option value={4}>4 Berita (Standar)</option>
                      <option value={5}>5 Berita</option>
                      <option value={6}>6 Berita</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 2: Special Event / Sorotan Khusus */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs">
                    02
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Sorotan Khusus / Event</h3>
                    <p className="text-[11px] text-slate-500">Banner kartu promosi liputan khusus atau event daerah</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepage.specialEventWidget.enabled}
                    onChange={(e) =>
                      updateHomepage('specialEventWidget', {
                        ...settings.homepage.specialEventWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.homepage.specialEventWidget.enabled && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Judul Event / Sorotan
                      </label>
                      <input
                        type="text"
                        value={settings.homepage.specialEventWidget.eventTitle}
                        onChange={(e) =>
                          updateHomepage('specialEventWidget', {
                            ...settings.homepage.specialEventWidget,
                            eventTitle: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Label Badge (Pojok Kiri)
                      </label>
                      <input
                        type="text"
                        value={settings.homepage.specialEventWidget.eventBadge}
                        onChange={(e) =>
                          updateHomepage('specialEventWidget', {
                            ...settings.homepage.specialEventWidget,
                            eventBadge: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deskripsi Singkat
                    </label>
                    <textarea
                      rows={2}
                      value={settings.homepage.specialEventWidget.eventDescription}
                      onChange={(e) =>
                        updateHomepage('specialEventWidget', {
                          ...settings.homepage.specialEventWidget,
                          eventDescription: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Teks Tombol CTA
                      </label>
                      <input
                        type="text"
                        value={settings.homepage.specialEventWidget.actionText || 'Lihat Liputan'}
                        onChange={(e) =>
                          updateHomepage('specialEventWidget', {
                            ...settings.homepage.specialEventWidget,
                            actionText: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        URL Tujuan
                      </label>
                      <input
                        type="text"
                        value={settings.homepage.specialEventWidget.actionUrl || '/kategori/wisata'}
                        onChange={(e) =>
                          updateHomepage('specialEventWidget', {
                            ...settings.homepage.specialEventWidget,
                            actionUrl: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 3: Slot Banner Iklan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">
                    03
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Slot Banner Iklan (Sponsor)</h3>
                    <p className="text-[11px] text-slate-500">Banner ukuran 255x213 (Medium) atau 255x510 (Skyscraper)</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepage.adBannerWidget.enabled}
                    onChange={(e) =>
                      updateHomepage('adBannerWidget', {
                        ...settings.homepage.adBannerWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.homepage.adBannerWidget.enabled && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        URL Gambar Iklan
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.homepage.adBannerWidget.imageUrl || ''}
                          onChange={(e) =>
                            updateHomepage('adBannerWidget', {
                              ...settings.homepage.adBannerWidget,
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setMediaPickerTarget('homepage-ad')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Pilih Media
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        URL Link Tujuan Iklan
                      </label>
                      <input
                        type="text"
                        value={settings.homepage.adBannerWidget.targetUrl || ''}
                        onChange={(e) =>
                          updateHomepage('adBannerWidget', {
                            ...settings.homepage.adBannerWidget,
                            targetUrl: e.target.value,
                          })
                        }
                        placeholder="https://sponsor.id atau /halaman"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 4: Trending News */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                    04
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Berita Trending</h3>
                    <p className="text-[11px] text-slate-500">Daftar berita trending dengan thumbnail foto mini</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepage.trendingWidget.enabled}
                    onChange={(e) =>
                      updateHomepage('trendingWidget', {
                        ...settings.homepage.trendingWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.homepage.trendingWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Header Widget
                    </label>
                    <input
                      type="text"
                      value={settings.homepage.trendingWidget.title}
                      onChange={(e) =>
                        updateHomepage('trendingWidget', {
                          ...settings.homepage.trendingWidget,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maksimal Berita Ditampilkan
                    </label>
                    <select
                      value={settings.homepage.trendingWidget.limit}
                      onChange={(e) =>
                        updateHomepage('trendingWidget', {
                          ...settings.homepage.trendingWidget,
                          limit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    >
                      <option value={3}>3 Berita</option>
                      <option value={4}>4 Berita</option>
                      <option value={5}>5 Berita (Standar)</option>
                      <option value={6}>6 Berita</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 5: Topik Viral */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
                    05
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Topik Viral</h3>
                    <p className="text-[11px] text-slate-500">Ranking tag / topik yang paling banyak dibicarakan</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepage.viralTopicsWidget.enabled}
                    onChange={(e) =>
                      updateHomepage('viralTopicsWidget', {
                        ...settings.homepage.viralTopicsWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.homepage.viralTopicsWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Header Widget
                    </label>
                    <input
                      type="text"
                      value={settings.homepage.viralTopicsWidget.title}
                      onChange={(e) =>
                        updateHomepage('viralTopicsWidget', {
                          ...settings.homepage.viralTopicsWidget,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maksimal Topik Ditampilkan
                    </label>
                    <select
                      value={settings.homepage.viralTopicsWidget.limit}
                      onChange={(e) =>
                        updateHomepage('viralTopicsWidget', {
                          ...settings.homepage.viralTopicsWidget,
                          limit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    >
                      <option value={3}>3 Topik</option>
                      <option value={4}>4 Topik</option>
                      <option value={5}>5 Topik (Standar)</option>
                      <option value={8}>8 Topik</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Overview & Quick Preview */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                Struktur Sidebar Beranda
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Urutan komponen pada kolom kanan homepage (lebar 255px di desktop):
              </p>

              <div className="space-y-2 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.homepage.popularWidget.enabled
                      ? 'bg-red-50/60 border-red-200 text-red-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    {settings.homepage.popularWidget.title} ({settings.homepage.popularWidget.limit})
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.homepage.popularWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.homepage.specialEventWidget.enabled
                      ? 'bg-purple-50/60 border-purple-200 text-purple-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Sorotan Event Khusus
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.homepage.specialEventWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.homepage.adBannerWidget.enabled
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    Slot Iklan Banner
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.homepage.adBannerWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.homepage.trendingWidget.enabled
                      ? 'bg-blue-50/60 border-blue-200 text-blue-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-blue-600" />
                    {settings.homepage.trendingWidget.title} ({settings.homepage.trendingWidget.limit})
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.homepage.trendingWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.homepage.viralTopicsWidget.enabled
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-600" />
                    {settings.homepage.viralTopicsWidget.title} ({settings.homepage.viralTopicsWidget.limit})
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.homepage.viralTopicsWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
              </div>

              {onNavigateToPublic && (
                <button
                  type="button"
                  onClick={() => onNavigateToPublic('/')}
                  className="mt-4 w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat Tampilan Beranda Publik</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ARTICLE SIDEBAR SETTINGS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'article' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* General Behavior Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                Perilaku Kolom Halaman Artikel (Berita)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Aktifkan Sidebar Artikel</p>
                    <p className="text-[11px] text-slate-500">Tampilkan kolom kanan di samping isi berita</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.article.enabled}
                      onChange={(e) => updateArticle('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Sticky Scroll (Melayang)</p>
                    <p className="text-[11px] text-slate-500">Sidebar tetap terlihat saat membaca berita panjang</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.article.sticky}
                      onChange={(e) => updateArticle('sticky', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Widget 1: Terpopuler */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">
                    01
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Terpopuler (01 - 05)</h3>
                    <p className="text-[11px] text-slate-500">Daftar berita paling banyak dibaca pembaca</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.article.popularWidget.enabled}
                    onChange={(e) =>
                      updateArticle('popularWidget', {
                        ...settings.article.popularWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.article.popularWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Header Widget
                    </label>
                    <input
                      type="text"
                      value={settings.article.popularWidget.title}
                      onChange={(e) =>
                        updateArticle('popularWidget', {
                          ...settings.article.popularWidget,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maksimal Jumlah Berita
                    </label>
                    <select
                      value={settings.article.popularWidget.limit}
                      onChange={(e) =>
                        updateArticle('popularWidget', {
                          ...settings.article.popularWidget,
                          limit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    >
                      <option value={3}>3 Berita</option>
                      <option value={5}>5 Berita (Standar)</option>
                      <option value={8}>8 Berita</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 2: Diskusi Terpanas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs">
                    02
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Diskusi Terpanas</h3>
                    <p className="text-[11px] text-slate-500">Berita dengan respon dan komentar terbanyak</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.article.discussionWidget.enabled}
                    onChange={(e) =>
                      updateArticle('discussionWidget', {
                        ...settings.article.discussionWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.article.discussionWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Header Widget
                    </label>
                    <input
                      type="text"
                      value={settings.article.discussionWidget.title}
                      onChange={(e) =>
                        updateArticle('discussionWidget', {
                          ...settings.article.discussionWidget,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maksimal Jumlah Berita
                    </label>
                    <select
                      value={settings.article.discussionWidget.limit}
                      onChange={(e) =>
                        updateArticle('discussionWidget', {
                          ...settings.article.discussionWidget,
                          limit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    >
                      <option value={3}>3 Berita</option>
                      <option value={5}>5 Berita (Standar)</option>
                      <option value={7}>7 Berita</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 3: Tags & Topik Populer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                    03
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Tags & Topik Terkait</h3>
                    <p className="text-[11px] text-slate-500">Kumpulan tagar populer untuk navigasi lintas topik</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.article.topicsWidget.enabled}
                    onChange={(e) =>
                      updateArticle('topicsWidget', {
                        ...settings.article.topicsWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.article.topicsWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Header Widget
                    </label>
                    <input
                      type="text"
                      value={settings.article.topicsWidget.title}
                      onChange={(e) =>
                        updateArticle('topicsWidget', {
                          ...settings.article.topicsWidget,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maksimal Tag Ditampilkan
                    </label>
                    <select
                      value={settings.article.topicsWidget.limit}
                      onChange={(e) =>
                        updateArticle('topicsWidget', {
                          ...settings.article.topicsWidget,
                          limit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    >
                      <option value={6}>6 Tags</option>
                      <option value={8}>8 Tags (Standar)</option>
                      <option value={12}>12 Tags</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 4: Slot Iklan Banner Artikel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">
                    04
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Slot Banner Iklan Artikel</h3>
                    <p className="text-[11px] text-slate-500">Iklan display di sisi kanan pembaca berita</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.article.adBannerWidget.enabled}
                    onChange={(e) =>
                      updateArticle('adBannerWidget', {
                        ...settings.article.adBannerWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.article.adBannerWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Gambar Iklan
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.article.adBannerWidget.imageUrl || ''}
                        onChange={(e) =>
                          updateArticle('adBannerWidget', {
                            ...settings.article.adBannerWidget,
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaPickerTarget('article-ad')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Pilih Media
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link URL Tujuan
                    </label>
                    <input
                      type="text"
                      value={settings.article.adBannerWidget.targetUrl || ''}
                      onChange={(e) =>
                        updateArticle('adBannerWidget', {
                          ...settings.article.adBannerWidget,
                          targetUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Structure Overview */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                Struktur Sidebar Artikel
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Urutan komponen pada kolom kanan halaman berita (lebar 255px di desktop):
              </p>

              <div className="space-y-2 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.article.popularWidget.enabled
                      ? 'bg-red-50/60 border-red-200 text-red-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    {settings.article.popularWidget.title} ({settings.article.popularWidget.limit})
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.article.popularWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.article.discussionWidget.enabled
                      ? 'bg-orange-50/60 border-orange-200 text-orange-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    {settings.article.discussionWidget.title} ({settings.article.discussionWidget.limit})
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.article.discussionWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.article.topicsWidget.enabled
                      ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    {settings.article.topicsWidget.title} ({settings.article.topicsWidget.limit})
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.article.topicsWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.article.adBannerWidget.enabled
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    Slot Iklan Banner
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.article.adBannerWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
              </div>

              {onNavigateToPublic && (
                <button
                  type="button"
                  onClick={() => onNavigateToPublic('/berita')}
                  className="mt-4 w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat Contoh Halaman Artikel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VIDEO SIDEBAR SETTINGS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* General Behavior Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                Perilaku Kolom Halaman Video
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Aktifkan Sidebar Video</p>
                    <p className="text-[11px] text-slate-500">Tampilkan kolom kanan di samping pemutar video</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.video.enabled}
                      onChange={(e) => updateVideo('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Sticky Scroll (Melayang)</p>
                    <p className="text-[11px] text-slate-500">Sidebar tetap terlihat saat halaman digulir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.video.sticky}
                      onChange={(e) => updateVideo('sticky', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Widget 1: Video Populer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">
                    01
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Video / Konten Populer</h3>
                    <p className="text-[11px] text-slate-500">Daftar tayangan populer 24 jam terakhir</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.video.popularWidget.enabled}
                    onChange={(e) =>
                      updateVideo('popularWidget', {
                        ...settings.video.popularWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.video.popularWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Header Widget
                    </label>
                    <input
                      type="text"
                      value={settings.video.popularWidget.title}
                      onChange={(e) =>
                        updateVideo('popularWidget', {
                          ...settings.video.popularWidget,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maksimal Tayangan Ditampilkan
                    </label>
                    <select
                      value={settings.video.popularWidget.limit}
                      onChange={(e) =>
                        updateVideo('popularWidget', {
                          ...settings.video.popularWidget,
                          limit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    >
                      <option value={3}>3 Tayangan</option>
                      <option value={5}>5 Tayangan (Standar)</option>
                      <option value={8}>8 Tayangan</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 2: Video Terkait & Terbaru */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">
                    02
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Widget Video Terkait & Terbaru</h3>
                    <p className="text-[11px] text-slate-500">Tayangan rekomendasi seputar topik serupa</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.video.relatedVideosWidget.enabled}
                    onChange={(e) =>
                      updateVideo('relatedVideosWidget', {
                        ...settings.video.relatedVideosWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.video.relatedVideosWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Header Widget
                    </label>
                    <input
                      type="text"
                      value={settings.video.relatedVideosWidget.title}
                      onChange={(e) =>
                        updateVideo('relatedVideosWidget', {
                          ...settings.video.relatedVideosWidget,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maksimal Video Ditampilkan
                    </label>
                    <select
                      value={settings.video.relatedVideosWidget.limit}
                      onChange={(e) =>
                        updateVideo('relatedVideosWidget', {
                          ...settings.video.relatedVideosWidget,
                          limit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    >
                      <option value={3}>3 Video</option>
                      <option value={5}>5 Video (Standar)</option>
                      <option value={8}>8 Video</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 3: Slot Iklan Banner Video */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">
                    03
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Slot Banner Iklan Video</h3>
                    <p className="text-[11px] text-slate-500">Iklan sponsor di samping pemutar video</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.video.adBannerWidget.enabled}
                    onChange={(e) =>
                      updateVideo('adBannerWidget', {
                        ...settings.video.adBannerWidget,
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.video.adBannerWidget.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Gambar Iklan
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.video.adBannerWidget.imageUrl || ''}
                        onChange={(e) =>
                          updateVideo('adBannerWidget', {
                            ...settings.video.adBannerWidget,
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaPickerTarget('video-ad')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Pilih Media
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link URL Tujuan
                    </label>
                    <input
                      type="text"
                      value={settings.video.adBannerWidget.targetUrl || ''}
                      onChange={(e) =>
                        updateVideo('adBannerWidget', {
                          ...settings.video.adBannerWidget,
                          targetUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Structure Overview */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                Struktur Sidebar Video
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Urutan komponen pada kolom kanan halaman video (lebar 255px di desktop):
              </p>

              <div className="space-y-2 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.video.popularWidget.enabled
                      ? 'bg-red-50/60 border-red-200 text-red-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    {settings.video.popularWidget.title} ({settings.video.popularWidget.limit})
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.video.popularWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.video.relatedVideosWidget.enabled
                      ? 'bg-blue-50/60 border-blue-200 text-blue-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    {settings.video.relatedVideosWidget.title} ({settings.video.relatedVideosWidget.limit})
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.video.relatedVideosWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    settings.video.adBannerWidget.enabled
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    Slot Iklan Banner
                  </span>
                  <span className="text-[10px] font-bold">
                    {settings.video.adBannerWidget.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
              </div>

              {onNavigateToPublic && (
                <button
                  type="button"
                  onClick={() => onNavigateToPublic('/videos')}
                  className="mt-4 w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat Halaman Galeri Video</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INFORMATION PAGES (NO SIDEBAR EXPLANATION & VERIFICATION)          */}
      {/* ========================================================================= */}
      {activeTab === 'info_pages' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-4xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 rounded-md">
                KEBIJAKAN DESAIN RESMI
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Halaman Informasi Bersih Tanpa Sidebar
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Sesuai kesepakatan struktur portal BatuTV, seluruh <strong>Halaman Informasi</strong> (seperti Tentang Kami, Susunan Redaksi, Pedoman Pemberitaan Media Siber, Kode Etik Jurnalistik, Disclaimer, dan Kebijakan Privasi) <strong>tidak menggunakan sidebar</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2">
                <Check className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Format Satu Kolom (Single Column)</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Dokumen resmi ditampilkan di tengah dengan lebar proporsional (max-w-4xl) agar nyaman dibaca tanpa distraksi.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2">
                <Check className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Bebas Distraksi & Iklan</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Tidak menampilkan banner promosi atau widget terpopuler yang mengganggu keterbacaan pasal-pasal hukum & etika.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2">
                <Check className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Manajemen Konten Terpusat</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Isi dokumen informasi dapat diedit secara langsung melalui menu <strong>Halaman Informasi</strong> di dashboard.
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Untuk mengubah naskah atau isi konten halaman statis, buka modul Halaman Informasi.</span>
            </div>
            {onNavigateToPublic && (
              <button
                type="button"
                onClick={() => onNavigateToPublic('/batutv-control/pages')}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors shrink-0 ml-3 cursor-pointer"
              >
                Ke Halaman Informasi
              </button>
            )}
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        onSelectMedia={(media: AdminMedia) => {
          if (mediaPickerTarget === 'homepage-ad') {
            updateHomepage('adBannerWidget', {
              ...settings.homepage.adBannerWidget,
              imageUrl: media.url,
            });
          } else if (mediaPickerTarget === 'article-ad') {
            updateArticle('adBannerWidget', {
              ...settings.article.adBannerWidget,
              imageUrl: media.url,
            });
          } else if (mediaPickerTarget === 'video-ad') {
            updateVideo('adBannerWidget', {
              ...settings.video.adBannerWidget,
              imageUrl: media.url,
            });
          }
          setMediaPickerTarget(null);
        }}
        title="Pilih Banner Iklan dari Media Library"
      />
    </div>
  );
};
