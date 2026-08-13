'use client';

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, Eye, Share2, Maximize2, Monitor, Download, Bot, Smile, ChevronDown, ChevronRight, PlaySquare, Share, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';

const Player = dynamic(() => import('@/components/Player'), { ssr: false });

interface VOD {
  id: string;
  title: string;
  date: string;
  duration: string;
  views: string;
  category: string;
  thumbnail: string;
  youtubeId: string;
  vkId?: string;
  playlistId?: string;
  status?: string;
}

interface Playlist {
  id: string;
  title: string;
  thumbnail: string;
  vodIds: string[];
}

export default function VodPage() {
  const params = useParams();
  const id = params.id as string;

  const [vod, setVod] = useState<VOD | null>(null);
  const [allVods, setAllVods] = useState<VOD[]>([]);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [activeTab, setActiveTab] = useState<'playlist' | 'timecodes'>('playlist');
  const [source, setSource] = useState<'youtube' | 'torrent' | 'vk'>('youtube');
  const [chatSettings, setChatSettings] = useState({ bots: false, emotes: true });
  const [theaterMode, setTheaterMode] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/vods.json').then(res => res.json()),
      fetch('/data/playlists.json').then(res => res.json()).catch(() => [])
    ]).then(([vodsData, playlistsData]) => {
      setAllVods(vodsData);
      const found = vodsData.find((v: VOD) => v.id === id);
      if (found) {
        setVod(found);
        if (found.youtubeId) setSource('youtube');
        else if (found.vkId) setSource('vk');
        else setSource('torrent');
        
        if (found.playlistId) {
          const pl = playlistsData.find((p: Playlist) => p.id === found.playlistId);
          if (pl) setPlaylist(pl);
        }
      }
    }).catch(err => console.error(err));
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Ссылка скопирована в буфер обмена!');
  };

  const handleFullscreen = () => {
    const btn = document.querySelector('.plyr [data-plyr="fullscreen"]') as HTMLButtonElement;
    if (btn) {
      btn.click();
    } else {
      const el = playerContainerRef.current;
      if (el?.requestFullscreen) el.requestFullscreen();
    }
  };

  const timecodes = [
    { section: 'Интро', items: [{ time: '0:45', title: 'Интро' }, { time: '3:53 - 6:36', title: 'Стример' }, { time: '10:39', title: 'Звуки для доната' }] },
    { section: 'Трейлеры', items: [{ time: '22:21', title: 'Syndicate' }, { time: '43:55', title: 'Frozen Ship' }] },
    { section: 'The Backrooms: Incident 1997 - пройдено', items: [{ time: '49:30', title: 'Меню' }, { time: '50:47', title: 'Интро' }, { time: '51:22', title: 'Игра' }] },
    { section: 'Lurking (демо)', items: [{ time: '1:22:01', title: 'Меню' }, { time: '1:25:51', title: 'Интро' }] },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f13]">
      <nav className="w-full z-50 p-4 border-b border-white/5 bg-[#141419]">
        <div className="max-w-[1920px] mx-auto flex items-center gap-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold tracking-wider text-sm">Архив стримов Hyver</span>
            </button>
          </Link>
          <div className="flex gap-4 text-sm text-gray-400">
            <button className="hover:text-white">Поиск</button>
            <button className="hover:text-white">Поддержать проект</button>
          </div>
          <div className="flex-grow"></div>
          <input 
            type="text" 
            placeholder="Быстрый переход" 
            className="bg-black/50 border border-white/10 rounded px-4 py-1 text-sm focus:outline-none focus:border-violet-500 text-gray-300 w-64"
          />
        </div>
      </nav>

      <main className="flex-grow flex max-w-[1920px] mx-auto w-full h-[calc(100vh-65px)] overflow-hidden">
        
        {!theaterMode && (
          <div className="w-[300px] flex-shrink-0 border-r border-white/5 bg-[#141419] flex flex-col overflow-hidden transition-all">
          <div className="flex text-xs font-bold tracking-widest text-gray-500 border-b border-white/5">
            <button 
              onClick={() => setActiveTab('playlist')}
              className={`flex-1 py-3 text-center transition-colors hover:bg-white/5 ${activeTab === 'playlist' ? 'text-white border-b-2 border-violet-500 bg-white/5' : ''}`}
            >
              ПЛЕЙЛИСТ
            </button>
            <button 
              onClick={() => setActiveTab('timecodes')}
              className={`flex-1 py-3 text-center transition-colors hover:bg-white/5 ${activeTab === 'timecodes' ? 'text-white border-b-2 border-violet-500 bg-white/5' : ''}`}
            >
              ТАЙМКОДЫ
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {activeTab === 'playlist' && playlist && (
              <div className="flex flex-col gap-4">
                <div className="relative rounded-lg overflow-hidden border border-white/10 group mt-1 mx-1">
                  <img src={playlist.thumbnail} alt={playlist.title} className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                    <span className="text-white font-bold text-sm leading-tight drop-shadow-md">{playlist.title}</span>
                    <span className="text-gray-300 text-xs mt-1">{playlist.vodIds.length} видео</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {playlist.vodIds.map((vId) => {
                    const plVod = allVods.find(v => v.id === vId);
                    if (!plVod) return null;
                    const isActive = plVod.id === id;
                    return (
                      <Link key={vId} href={`/vod/${plVod.id}`}>
                        <div className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
                           <div className="relative w-24 aspect-video shrink-0 rounded overflow-hidden">
                             <img src={plVod.thumbnail} className="w-full h-full object-cover" />
                             {isActive && (
                               <div className="absolute inset-0 bg-violet-500/30 flex items-center justify-center">
                                  <Play className="w-6 h-6 text-white fill-white" />
                               </div>
                             )}
                           </div>
                           <div className="flex flex-col justify-center overflow-hidden">
                              <span className={`text-xs font-semibold line-clamp-2 leading-snug ${isActive ? 'text-white' : 'text-gray-300'}`}>{plVod.title}</span>
                              <span className="text-[10px] text-gray-500 mt-1">{plVod.date}</span>
                           </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === 'playlist' && !playlist && (
              <div className="text-center text-sm text-gray-500 mt-10 p-4 border border-white/5 rounded mx-2 bg-white/5">
                Это видео не принадлежит ни к одному плейлисту.
              </div>
            )}

            {activeTab === 'timecodes' && timecodes.map((group, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-center gap-1 text-gray-300 text-sm font-semibold p-1 cursor-pointer hover:bg-white/5 rounded">
                  <ChevronDown className="w-4 h-4" />
                  <span className="truncate">{group.section}</span>
                </div>
                <div className="pl-6 flex flex-col gap-1 mt-1">
                  {group.items.map((item, j) => (
                    <div key={j} className="flex gap-2 text-sm hover:bg-white/5 p-1 rounded cursor-pointer group">
                      <span className="text-[#3b82f6] font-mono text-xs mt-[2px] shrink-0 group-hover:text-[#60a5fa] transition-colors">{item.time}</span>
                      <span className="text-gray-400 group-hover:text-gray-200 transition-colors line-clamp-2 leading-tight">— {item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        <div ref={playerContainerRef} className="flex-grow flex flex-col bg-black relative overflow-y-auto custom-scrollbar">
          <div className={`w-full relative bg-black flex items-center justify-center transition-all ${theaterMode ? 'h-[calc(100vh-125px)]' : 'aspect-video'}`}>
            {vod?.status === 'processing' ? (
              <div className="text-gray-400 flex flex-col items-center justify-center gap-6 p-8 text-center bg-[#0a0a0c] w-full h-full">
                <div className="w-16 h-16 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin"></div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Видео находится в обработке</h3>
                  <p className="max-w-md text-sm leading-relaxed">Сервер скачивает и подготавливает этот стрим для комфортного просмотра. Пожалуйста, зайдите немного позже ☕</p>
                </div>
              </div>
            ) : source === 'youtube' && vod?.youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${vod.youtubeId}?autoplay=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : source === 'vk' && vod?.vkId ? (
              <iframe
                src={`https://vk.com/video_ext.php?${vod.vkId}`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture;"
                allowFullScreen
              ></iframe>
            ) : source === 'torrent' ? (
              <div className="w-full h-full [&>.plyr]:h-full [&_.plyr__video-wrapper]:h-full [&_video]:h-full">
                <Player src={`/vods/${id}/master.m3u8`} type="hls" />
              </div>
            ) : (
              <div className="text-gray-500 flex flex-col items-center gap-4">
                <Play className="w-16 h-16 opacity-20" />
                <p>Загрузка источника...</p>
              </div>
            )}
          </div>

          {vod?.status !== 'processing' && (
            <div className="bg-[#14151a] p-4 border-b border-[#1f2028] flex flex-wrap items-center justify-between">
              <div className="flex gap-2">
                {vod?.youtubeId && (
                  <button
                    onClick={() => setSource('youtube')}
                    className={`px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors ${source === 'youtube' ? 'bg-[#2a2b36] text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    YouTube
                  </button>
                )}
                {vod?.vkId && (
                  <button
                    onClick={() => setSource('vk')}
                    className={`px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors ${source === 'vk' ? 'bg-[#0077FF] text-white' : 'bg-[#2a2b36] text-gray-400 hover:text-white'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.077 7.042c1.93-.05 3.869.043 5.792.052.744.025 1.57.14 2.155.65.617.536.83 1.348.883 2.135.1 1.48.09 2.97.094 4.453 0 1.25-.018 2.508-.106 3.753-.083 1.155-.386 2.37-1.39 3.064-.813.563-1.84.582-2.775.59-1.996.017-3.991.002-5.987.003-2.106 0-4.212.015-6.318-.003-.935-.008-1.962-.027-2.775-.59-1.004-.694-1.307-1.909-1.39-3.064-.088-1.245-.106-2.503-.106-3.753.004-1.483-.006-2.973.094-4.453.053-.787.266-1.599.883-2.135.585-.51 1.411-.625 2.155-.65 2.535-.022 5.075-.015 7.61-.018.06.012.12.006.18.016zm-.34 3.013c-.02-.008-.042-.014-.063-.02-1.385.748-2.774 1.49-4.16 2.235-.38.204-.37.784.004.992 1.383.771 2.774 1.527 4.162 2.293.414.228.917-.076.913-.553-.005-1.528 0-3.058-.003-4.586-.002-.27-.24-.462-.486-.363-.122.05-.25.105-.366.002z"/></svg>
                    VK Video
                  </button>
                )}
                {!vod?.youtubeId && !vod?.vkId && (
                  <button onClick={() => setSource('torrent')} className="px-3 py-1.5 rounded bg-[#2481cc] text-white text-sm font-semibold flex items-center gap-2">
                    <Download className="w-4 h-4" /> Скачать
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button onClick={handleShare} className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-sm flex items-center gap-2 transition-colors">
                  <Share className="w-4 h-4" /> Поделиться
                </button>
                <button onClick={() => setTheaterMode(!theaterMode)} className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${theaterMode ? 'bg-violet-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}>
                  <LayoutTemplate className="w-4 h-4" /> На всё окно
                </button>
                <button onClick={handleFullscreen} className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-sm flex items-center gap-2 transition-colors">
                  <Maximize2 className="w-4 h-4" /> На весь экран
                </button>
              </div>
            </div>
          )}

          {/* Информация о видео */}
          <div className="p-6 bg-[#0f0f13] flex-grow flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{vod?.title || "Загрузка..."}</h1>
              <p className="text-gray-400 text-sm">В эфире: {vod?.date || ""} • {vod?.views || "0"} просмотров</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#141419] p-4 rounded-xl border border-white/5">
              {/* Аватар стримера */}
              <img 
                src="/images/avatar.png" 
                alt="Hyver" 
                className="w-16 h-16 rounded-full border-2 border-violet-500 object-cover"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Hyver</h2>
                  <svg className="w-4 h-4 text-violet-500 fill-current" viewBox="0 0 20 20"><path d="M10 2l2.25 2.25L15 4.5l.25 2.75 2.25 2.25-2.25 2.25-.25 2.75-2.75-.25L10 18l-2.25-2.25L5 15.5l-.25-2.75L2.5 10l2.25-2.25.25-2.75 2.75.25L10 2z"/><path fill="#0f0f13" d="M13.2 7.7l-4.5 4.5-2.2-2.2-1.4 1.4 3.6 3.6 5.9-5.9z"/></svg>
                </div>
                <p className="text-gray-400 text-sm">312 тыс. отслеживающих</p>
              </div>
            </div>

            <div className="glassmorphism p-4 rounded-xl inline-block w-fit">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-violet-500/20 text-violet-300 text-xs font-bold rounded">Категория</span>
                <span className="text-gray-200 font-semibold">{vod?.category || "Just Chatting"}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
                Официальный архив стримов. Здесь хранятся все записи прямых трансляций, включая игровые прохождения, реакты и разговорные стримы.<br/><br/>
                Приятного просмотра!
              </p>
            </div>
          </div>
        </div>

        {/* Правая панель: Чат */}
        {!theaterMode && (
          <div className="w-[350px] flex-shrink-0 border-l border-white/5 bg-[#141419] flex flex-col relative transition-all">
            <div className="p-3 text-center border-b border-white/5 text-sm font-bold tracking-widest text-gray-500 uppercase">
              Чат трансляции
          </div>
          
          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-start gap-3 text-sm text-gray-300 bg-[#0f0f13] custom-scrollbar">
            {/* Имитация реального чата Hyver */}
            <div className="text-center text-gray-600 mb-2 text-xs">Добро пожаловать в чат!</div>
            <div className="break-words"><span className="text-[#FF5252] font-bold">Nightbot:</span> Добро пожаловать на канал Hyver! Всем приятного просмотра.</div>
            <div className="break-words"><span className="text-[#FFB300] font-bold">RandomViewer:</span> здарова работяги</div>
            <div className="break-words"><span className="text-[#4CAF50] font-bold">PepeFrog:</span> KEKW LUL</div>
            <div className="break-words flex gap-2 items-start">
              <span className="text-[#2196F3] font-bold shrink-0">Oldfag2018:</span> 
              <span>во что сегодня играем? 🤔</span>
            </div>
            <div className="break-words"><span className="text-[#9C27B0] font-bold">GamerPro:</span> о, подруб</div>
            <div className="break-words"><span className="text-white font-bold bg-[#E91E63] px-1 rounded mr-1 text-[10px]">SUB</span><span className="text-[#00BCD4] font-bold">Hyver_Fan:</span> Привет! Наконец-то дождались)</div>
            <div className="break-words"><span className="text-[#FF9800] font-bold">ChattingBot:</span> PogChamp PogChamp PogChamp</div>
          </div>

          {/* Панель настроек чата */}
          <div className="p-2 bg-[#1a1a22] border-t border-white/5 flex items-center gap-1 justify-between">
            <div className="flex gap-1">
              {/* Кнопка Ботов */}
              <button 
                onClick={() => setChatSettings(s => ({...s, bots: !s.bots}))}
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-colors relative group"
              >
                <Bot className="w-5 h-5" />
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${chatSettings.bots ? 'bg-green-500' : 'bg-red-500'}`}></div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black text-xs text-white rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Показывать ответы ботов (выключено)
                </div>
              </button>

              {/* Кнопка Смайликов */}
              <button 
                onClick={() => setChatSettings(s => ({...s, emotes: !s.emotes}))}
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-colors relative group"
              >
                <Smile className="w-5 h-5" />
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${chatSettings.emotes ? 'bg-green-500' : 'bg-red-500'}`}></div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-center bg-black text-xs text-white rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Показывать смайлики Twitch, BetterTTV (включено)
                </div>
              </button>
            </div>

            {/* Скачать чат */}
            <button className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-colors group relative">
              <Download className="w-5 h-5" />
              <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap p-2 bg-black text-xs text-white rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Скачать лог чата
              </div>
            </button>
          </div>
        </div>
        )}

      </main>
    </div>
  );
}
