'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Tv,
  Users,
  Calendar,
  Share2,
  Clock,
  Send,
  Sparkles,
  Check,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { liveScheduleData } from '@/src/data/dummyNews';
import { PublicVideoItem } from '../types';
import { VideoCard } from './VideoCard';

interface LiveStreamViewProps {
  relatedVideos: PublicVideoItem[];
}

interface ChatMessage {
  id: number;
  user: string;
  badge?: string;
  text: string;
  time: string;
}

export function LiveStreamView({ relatedVideos }: LiveStreamViewProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'schedule'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      user: 'Arema_Batu87',
      text: 'Salam dari Alun-Alun Kota Batu! Gambar jernih banget min 👍',
      time: '11:42',
    },
    {
      id: 2,
      user: 'Siti_Agro',
      text: 'Liputan apel Bumiaji tadi mantap, semoga petani semakin makmur',
      time: '11:43',
    },
    {
      id: 3,
      user: 'WisataJatim_Guide',
      text: 'Info jalur lingkar barat Klemuk apakah sudah buka normal?',
      time: '11:44',
    },
    {
      id: 4,
      user: 'BatuTV_Moderator',
      badge: 'MODERATOR',
      text: 'Selamat bergabung pemirsa! Jalur Klemuk aman terpantau lancar dua arah. Pantau terus update lalu lintas di BatuTV.',
      time: '11:45',
    },
    {
      id: 5,
      user: 'Mas_Bambang_Batu',
      text: 'Kualitas audio mantap studio 1! Lanjut terus liputan daerahnya.',
      time: '11:47',
    },
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = chatInput.trim();
    if (!clean) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'Anda',
        text: clean,
        time: timeStr,
      },
    ]);
    setChatInput('');
  };

  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-10">
      {/* Broadcast Theater Section */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Stream Top Bar */}
        <div className="bg-neutral-950 px-4 sm:px-6 py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>LIVE ON AIR</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-medium border-l border-neutral-800 pl-3">
              <Tv className="w-3.5 h-3.5 text-red-500" />
              <span>Studio 1 Kota Wisata Batu</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
              <Users className="w-3.5 h-3.5" />
              <span>12.480+ Pemirsa Menonton</span>
            </div>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition cursor-pointer"
              title="Bagikan Live Streaming"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Grid Stage + Interaction Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Main Live Player Column (8 Cols) */}
          <div className="lg:col-span-8 p-3 sm:p-5 flex flex-col justify-between bg-black/40">
            {/* Live Video Frame */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-neutral-800 group">
              <iframe
                src="https://www.youtube-nocookie.com/embed/live_stream?channel=UC8bTV_BatuTV_Official&autoplay=1&mute=0"
                title="BatuTV Siaran Langsung Digital"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />

              {/* Watermark Overlay */}
              <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2">
                <div className="bg-red-600/90 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded shadow-md backdrop-blur-xs">
                  BATUTV HD
                </div>
                <div className="bg-black/60 text-neutral-200 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border border-white/10 backdrop-blur-xs">
                  1080p 60fps
                </div>
              </div>
            </div>

            {/* Program Info Bar */}
            <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap items-start justify-between gap-4 text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-red-500 uppercase tracking-wide">
                    Program Utama
                  </span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-[11px] text-neutral-400">
                    Senin – Minggu (24 Jam)
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black font-serif tracking-tight text-white">
                  Batu Hari Ini Siang (Live Streaming)
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2">
                  Warta aktual seputar agropolitan, denyut pariwisata Kota Wisata Batu, perkembangan ekonomi kreatif Malang Raya, serta informasi publik terpercaya Jawa Timur.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                  CH 48 UHF / TV Digital
                </span>
              </div>
            </div>
          </div>

          {/* Right Interaction Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-neutral-950/80 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col h-[480px] lg:h-auto">
            {/* Tabs Toggle */}
            <div className="grid grid-cols-2 p-1.5 bg-neutral-900 border-b border-neutral-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-red-500" />
                <span>Live Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Jadwal Acara</span>
              </button>
            </div>

            {/* Tab: Live Chat */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="p-3 bg-neutral-900/50 border-b border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Obrolan dipantau moderator redaksi
                  </span>
                  <span className="text-[10px] text-neutral-500">Komentar publik</span>
                </div>

                {/* Messages List */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-lg ${
                        msg.badge
                          ? 'bg-red-950/40 border border-red-800/50'
                          : 'bg-neutral-900/80 border border-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              msg.badge ? 'text-red-400' : 'text-neutral-200'
                            }`}
                          >
                            {msg.user}
                          </span>
                          {msg.badge && (
                            <span className="text-[9px] bg-red-600 text-white font-extrabold px-1 rounded">
                              {msg.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {msg.time}
                        </span>
                      </div>
                      <p className="text-neutral-300 break-words leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chat Form */}
                <form
                  onSubmit={handleSendChat}
                  className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tulis tanggapan atau salam pemirsa..."
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-red-500"
                    maxLength={140}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
                    title="Kirim Komentar"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Schedule */}
            {activeTab === 'schedule' && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Jadwal Tayang TV Hari Ini
                </div>
                {liveScheduleData.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 transition ${
                      item.isLiveNow
                        ? 'bg-red-950/60 border border-red-600/60 text-white shadow-sm'
                        : 'bg-neutral-900/60 border border-neutral-800/60 text-neutral-300'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-amber-400">
                          {item.time}
                        </span>
                        {item.isLiveNow && (
                          <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded animate-pulse">
                            ON AIR
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-neutral-100 truncate">
                        {item.program}
                      </div>
                      {item.presenter && (
                        <div className="text-[11px] text-neutral-400 truncate">
                          Presenter: {item.presenter}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recommended News Videos Section */}
      {relatedVideos.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Liputan Pilihan</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-neutral-900 dark:text-white uppercase">
                Video Berita Terkait
              </h3>
            </div>
            <Link
              href="/video"
              className="text-xs font-bold text-red-600 hover:text-red-700 dark:hover:text-red-400 transition"
            >
              Lihat Semua Galeri Video &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedVideos.slice(0, 6).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
