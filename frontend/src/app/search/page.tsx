'use client';

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, SortDesc, SortAsc, PlayCircle, Eye, Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface VOD {
  id: string;
  title: string;
  date: string;
  duration: string;
  views: string;
  category: string;
  thumbnail: string;
  youtubeId: string;
}

export default function SearchPage() {
  const [allVods, setAllVods] = useState<VOD[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'streams' | 'games'>('streams');
  
  // Filters state
  const [showViewed, setShowViewed] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedSource, setSelectedSource] = useState("any");
  
  // Results state
  const [sortBy, setSortBy] = useState('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  useEffect(() => {
    fetch('/data/vods.json')
      .then(res => res.json())
      .then(data => setAllVods(data))
      .catch(err => console.error(err));
  }, []);

  const filteredVods = useMemo(() => {
    let result = allVods;
    
    // Text search
    if (searchQuery) {
      result = result.filter(vod => 
        vod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        vod.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Source filter
    if (selectedSource !== 'any') {
      if (selectedSource === 'youtube') {
        result = result.filter(vod => !!vod.youtubeId);
      } else if (selectedSource === 'hls') {
        result = result.filter(vod => !vod.youtubeId); // Mock logic for HLS only
      }
    }
    
    // Sorting (Mock implementation, assuming 'date' string needs parsing or just reversing array)
    if (sortBy === 'date') {
      // In a real app, parse the date properly. For now, we assume chronological order in json.
      result = sortDesc ? result : [...result].reverse();
    } else if (sortBy === 'alpha') {
      result = [...result].sort((a, b) => 
        sortDesc ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)
      );
    }
    
    return result;
  }, [allVods, searchQuery, selectedSource, sortBy, sortDesc]);

  return (
    <div className="min-h-screen bg-[#111111] text-gray-300 font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-[#333] shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Архив стримов Hyver
            </Link>
            <span className="text-white font-medium">Поиск</span>
            <button className="text-gray-400 hover:text-white transition-colors">Поддержать проект</button>
          </div>
          
          <div className="w-64">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Быстрый переход" 
                className="w-full bg-[#0d0d0d] border border-[#333] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start pt-6 px-4 gap-6">
        
        {/* Left Sidebar (Filters) */}
        <aside className="w-full md:w-[280px] shrink-0 bg-[#1a1a1a] border border-[#333] rounded flex flex-col">
          
          {/* Tabs */}
          <div className="flex items-center p-3 border-b border-[#333]">
            <span className="text-xs text-gray-500 uppercase font-bold mr-3">Искать:</span>
            <div className="flex bg-[#0d0d0d] rounded overflow-hidden text-sm flex-1">
              <button 
                onClick={() => setActiveTab('streams')}
                className={`flex-1 py-1.5 text-center transition-colors ${activeTab === 'streams' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:bg-[#222]'}`}
              >
                Стримы
              </button>
              <button 
                onClick={() => setActiveTab('games')}
                className={`flex-1 py-1.5 text-center transition-colors ${activeTab === 'games' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:bg-[#222]'}`}
              >
                Игры
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-4 border-b border-[#333]">
            <div className="text-xs text-gray-500 font-bold tracking-wider mb-4 text-center uppercase">Фильтры</div>
            
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${showViewed ? 'bg-blue-600 border-blue-600' : 'bg-[#0d0d0d] border-[#333]'}`}>
                {showViewed && <div className="w-2 h-0.5 bg-white rounded-full"></div>}
              </div>
              <input type="checkbox" className="hidden" checked={showViewed} onChange={(e) => setShowViewed(e.target.checked)} />
              <span className="text-sm">Просмотренные</span>
            </label>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm">Месяц</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-[#0d0d0d] border border-[#333] rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 w-32 text-gray-300"
              >
                <option value="">--.----</option>
                <option value="08.2026">08.2026</option>
                <option value="07.2026">07.2026</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Источник</span>
              <select 
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-[#0d0d0d] border border-[#333] rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 w-32 text-gray-300"
              >
                <option value="any">Любой</option>
                <option value="youtube">YouTube</option>
                <option value="hls">Telegram HLS</option>
              </select>
            </div>
          </div>

          {/* Results Section */}
          <div className="p-4">
            <div className="text-xs text-gray-500 font-bold tracking-wider mb-4 text-center uppercase">Результаты</div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm mr-auto">Сортировка</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#0d0d0d] border border-[#333] rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 text-gray-300"
              >
                <option value="date">по дате</option>
                <option value="alpha">по алфавиту</option>
              </select>
              <button 
                onClick={() => setSortDesc(!sortDesc)}
                className="w-7 h-7 flex items-center justify-center bg-[#0d0d0d] border border-[#333] rounded hover:bg-[#222] transition-colors"
              >
                {sortDesc ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm mr-auto">Количество:</span>
              <div className="flex gap-1">
                {[10, 25, 50, 100].map(num => (
                  <button 
                    key={num}
                    onClick={() => setItemsPerPage(num)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${itemsPerPage === num ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:bg-[#222]'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 pb-20">
          
          {/* Search Bar */}
          <div className="flex items-stretch mb-6">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию" 
              className="flex-1 bg-[#1a1a1a] border border-[#333] border-r-0 rounded-l px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-r text-sm font-medium transition-colors">
              Найти
            </button>
          </div>

          {/* List of VODs */}
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {filteredVods.slice(0, itemsPerPage).map((vod, index) => (
                <motion.div
                  key={vod.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-4 p-2 rounded hover:bg-[#1a1a1a] transition-colors group"
                >
                  {/* Thumbnail */}
                  <Link href={`/vod/${vod.id}`} className="relative shrink-0 overflow-hidden rounded shadow-md w-48 sm:w-64 aspect-video bg-[#222]">
                    <img src={vod.thumbnail} alt={vod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    
                    {vod.status === "processing" && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin mb-1"></div>
                        <span className="text-violet-400 font-bold text-[10px] tracking-widest uppercase">В обработке</span>
                      </div>
                    )}

                    {/* Timestamp / Duration overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm text-center py-1 z-20">
                      <span className="text-xs font-bold text-white tracking-wide">{vod.duration}</span>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex flex-col flex-1 py-1">
                    <Link href={`/vod/${vod.id}`} className="text-blue-400 hover:text-blue-300 font-medium text-lg leading-tight mb-2 transition-colors">
                      {vod.title}
                    </Link>
                    <div className="text-gray-400 text-sm mt-auto">
                      {vod.date}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredVods.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                По вашему запросу ничего не найдено.
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
