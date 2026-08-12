'use client';

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, Eye, Share2, Maximize2, Monitor, Download, Bot, Smile, ChevronDown, ChevronRight, PlaySquare, Share, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';

const Player = dynamic(() => import('@/components/Player'), { ssr: false });

export default function VodPage() {
  const params = useParams();
  const id = params.id;

  const [activeTab, setActiveTab] = useState<'playlist' | 'timecodes'>('timecodes');
  const [source, setSource] = useState<'twitch' | 'youtube' | 'torrent'>('youtube');
  const [chatSettings, setChatSettings] = useState({ bots: false, emotes: true });
  const [theaterMode, setTheaterMode] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Ссылка скопирована в буфер обмена!');
  };

  const handleFullscreen = () => {
    const btn = document.querySelector('.plyr [data-plyr="fullscreen"]') as HTMLButtonElement;
    if (btn) {
      btn.click();
    } else {
      console.error('Fullscreen button not found');
    }
  };

  // Dummy Timecodes matching the screenshot
  const timecodes = [
    { section: 'Интро', items: [{ time: '0:45', title: 'Интро' }, { time: '3:53 - 6:36', title: 'Стример' }, { time: '10:39', title: 'Звуки для доната' }] },
    { section: 'Трейлеры', items: [{ time: '22:21', title: 'Syndicate' }, { time: '43:55', title: 'Frozen Ship' }] },
    { section: 'The Backrooms: Incident 1997 - пройдено', items: [{ time: '49:30', title: 'Меню' }, { time: '50:47', title: 'Интро' }, { time: '51:22', title: 'Игра' }] },
    { section: 'Lurking (демо)', items: [{ time: '1:22:01', title: 'Меню' }, { time: '1:25:51', title: 'Интро' }] },
  ];

  const DUMMY_STREAM_URL = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f13]">
      {/* Верхняя навигация */}
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

      {/* Основной контейнер 3-колоночный */}
      <main className="flex-grow flex max-w-[1920px] mx-auto w-full h-[calc(100vh-65px)] overflow-hidden">
        
        {/* Левая панель: Плейлист и Таймкоды */}
        {!theaterMode && (
          <div className="w-[300px] flex-shrink-0 border-r border-white/5 bg-[#141419] flex flex-col overflow-hidden transition-all">
            {/* Табы */}
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
          
          {/* Контент таймкодов */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
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

        {/* Центр: Плеер и Информация */}
        <div ref={playerContainerRef} className="flex-grow flex flex-col bg-black relative overflow-y-auto custom-scrollbar">
          {/* Плеер */}
          <div className={`w-full relative bg-black flex items-center justify-center transition-all ${theaterMode ? 'h-[calc(100vh-125px)]' : 'aspect-video'}`}>
            {source === 'youtube' ? (
              <div className="w-full h-full [&>.plyr]:h-full [&_.plyr__video-wrapper]:h-full [&_video]:h-full">
                <Player src={DUMMY_STREAM_URL} />
              </div>
            ) : (
              <div className="text-gray-500 flex flex-col items-center gap-4">
                <Play className="w-16 h-16 opacity-20" />
                <p>Источник "{source}" недоступен. Выберите YouTube.</p>
              </div>
            )}
          </div>

          {/* Панель кнопок под плеером */}
          <div className="bg-[#141419] p-3 flex flex-wrap items-center justify-between border-b border-white/5">
            <div className="flex gap-2">
              <button onClick={() => setSource('twitch')} className={`px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors ${source === 'twitch' ? 'bg-[#9146FF] text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                Twitch
              </button>
              <button onClick={() => setSource('youtube')} className={`px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors ${source === 'youtube' ? 'bg-[#FF0000] text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                <PlaySquare className="w-4 h-4" /> YouTube
              </button>
              <button onClick={() => setSource('torrent')} className={`px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors ${source === 'torrent' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                <Download className="w-4 h-4" /> Торрент
              </button>
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

          {/* Информация о видео */}
          <div className="p-6 bg-[#0f0f13] flex-grow">
            <h1 className="text-2xl font-bold text-white mb-2">Вечер Всратых Хорроров (ВВХ) 2026 — 34</h1>
            <p className="text-gray-400 text-sm mb-6">Дата стрима: 7 августа 2026 г. (5 дней назад)</p>
            
            <div className="glassmorphism p-4 rounded-xl inline-block">
              <p className="text-gray-300 text-sm italic">Здесь будет располагаться подробное описание стрима, ссылки на игры и донаты.</p>
            </div>
          </div>
        </div>

        {/* Правая панель: Чат */}
        {!theaterMode && (
          <div className="w-[350px] flex-shrink-0 border-l border-white/5 bg-[#141419] flex flex-col relative transition-all">
            <div className="p-3 text-center border-b border-white/5 text-sm font-bold tracking-widest text-gray-500">
              ЧАТ
          </div>
          
          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end gap-2 text-sm text-gray-300 bg-[#0f0f13]">
            <p className="text-center text-gray-600 mb-4 italic">История чата пока не загружена...</p>
            {/* Тестовые сообщения */}
            <div className="break-words"><span className="text-[#ff5252] font-bold">Hyver:</span> Привет всем, начинаем через 5 минут!</div>
            <div className="break-words"><span className="text-[#448aff] font-bold">Viewer1:</span> Наконец-то ВВХ!</div>
            <div className="break-words"><span className="text-[#69f0ae] font-bold">GamerPro:</span> KEKW LUL</div>
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
