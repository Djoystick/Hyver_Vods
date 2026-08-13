'use client';

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, SortDesc, SortAsc, Hash } from "lucide-react";
import Link from "next/link";

interface VOD {
  id: string;
  title: string;
  date: string;
  duration: string;
  views: string;
  category: string;
  status?: string;
  thumbnail: string;
  youtubeId: string;
  vkId?: string;
}

export default function SearchPage() {
  const [allVods, setAllVods] = useState<VOD[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'streams' | 'tags' | 'movies'>('streams');
  
  // Results state
  const [sortBy, setSortBy] = useState('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);
  
  // Tags extraction
  const tags = useMemo(() => {
    const extracted = new Map<string, number>();
    allVods.forEach(v => {
      const match = v.title.match(/«([^»]+)»/);
      if (match) {
        let tag = match[1].replace(/#\d+/, '').trim().toLowerCase();
        if (tag.length > 3) {
          extracted.set(tag, (extracted.get(tag) || 0) + 1);
        }
      }
      const hashtags = v.title.match(/#([a-zA-Zа-яА-Я0-9_]+)/g);
      if (hashtags) {
        hashtags.forEach(ht => {
          if (!ht.match(/#\d+$/)) {
            let t = ht.replace('#', '').toLowerCase();
            extracted.set(t, (extracted.get(t) || 0) + 1);
          }
        });
      }
    });
    return Array.from(extracted.entries()).sort((a, b) => b[1] - a[1]);
  }, [allVods]);

  useEffect(() => {
    fetch('/data/vods.json')
      .then(res => res.json())
      .then(data => setAllVods(data))
      .catch(err => console.error(err));
  }, []);

  const filteredVods = useMemo(() => {
    let result = allVods;
    
    // Type separation
    const isMovie = (v: VOD) => {
      const c = v.category.toLowerCase();
      const t = v.title.toLowerCase();
      return c.includes('кино') || c.includes('шоу') || t.includes('киногонка');
    };

    if (activeTab === 'movies') {
      result = result.filter(v => isMovie(v));
    } else if (activeTab === 'streams') {
      result = result.filter(v => !isMovie(v));
    }
    
    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(vod => 
        vod.title.toLowerCase().includes(q) || 
        vod.category.toLowerCase().includes(q)
      );
    }
    
    // Sorting (Mock string date sort - assumes sequential IDs correlate with date for now)
    if (sortBy === 'date') {
      result = [...result].sort((a, b) => {
        return sortDesc ? parseInt(b.id) - parseInt(a.id) : parseInt(a.id) - parseInt(b.id);
      });
    } else if (sortBy === 'alpha') {
      result = [...result].sort((a, b) => 
        sortDesc ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)
      );
    }
    
    return result;
  }, [allVods, searchQuery, sortBy, sortDesc]);

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setActiveTab('streams');
    setVisibleCount(24);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-gray-300 font-sans">
      <nav className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-[#333] shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Архив стримов Hyver
            </Link>
            <span className="text-white font-medium">Поиск</span>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start pt-6 px-4 gap-6">
        
        <aside className="w-full md:w-[280px] shrink-0 bg-[#1a1a1a] border border-[#333] rounded flex flex-col">
          <div className="flex items-center p-3 border-b border-[#333]">
            <span className="text-xs text-gray-500 uppercase font-bold mr-3">Искать:</span>
            <div className="flex bg-[#0d0d0d] rounded overflow-hidden text-sm flex-1 flex-wrap">
              <button 
                onClick={() => setActiveTab('streams')}
                className={`flex-1 min-w-[33%] py-1.5 text-center transition-colors ${activeTab === 'streams' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:bg-[#222]'}`}
              >
                Стримы
              </button>
              <button 
                onClick={() => setActiveTab('movies')}
                className={`flex-1 min-w-[33%] py-1.5 text-center transition-colors ${activeTab === 'movies' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:bg-[#222]'}`}
              >
                Фильмы
              </button>
              <button 
                onClick={() => setActiveTab('tags')}
                className={`flex-1 min-w-[33%] py-1.5 text-center transition-colors ${activeTab === 'tags' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:bg-[#222]'}`}
              >
                Теги / Игры
              </button>
            </div>
          </div>

          {(activeTab === 'streams' || activeTab === 'movies') && (
            <div className="p-4">
              <div className="text-xs text-gray-500 font-bold tracking-wider mb-4 text-center uppercase">Сортировка</div>
              
              <div className="flex items-center gap-2 mb-4">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 bg-[#0d0d0d] border border-[#333] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-gray-300"
                >
                  <option value="date">По дате (новые/старые)</option>
                  <option value="alpha">По алфавиту</option>
                </select>
                <button 
                  onClick={() => setSortDesc(!sortDesc)}
                  className="w-8 h-8 flex items-center justify-center bg-[#0d0d0d] border border-[#333] rounded hover:bg-[#222] transition-colors"
                >
                  {sortDesc ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1 min-w-0 pb-20">
          {(activeTab === 'streams' || activeTab === 'movies') ? (
            <>
              <div className="flex items-stretch mb-6">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(24); }}
                  placeholder="Поиск по названию или категории..." 
                  className="flex-1 bg-[#1a1a1a] border border-[#333] border-r-0 rounded-l px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-r text-sm font-medium transition-colors">
                  Найти
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {filteredVods.slice(0, visibleCount).map((vod, index) => (
                    <motion.div
                      key={vod.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-4 p-2 rounded hover:bg-[#1a1a1a] transition-colors group"
                    >
                      <Link href={`/vod/${vod.id}`} className="relative shrink-0 overflow-hidden rounded shadow-md w-48 sm:w-64 aspect-video bg-[#222]">
                        <img src={vod.thumbnail} alt={vod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        
                        {vod.status === "processing" && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                            <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin mb-1"></div>
                            <span className="text-violet-400 font-bold text-[10px] tracking-widest uppercase">В обработке</span>
                          </div>
                        )}

                        <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm text-center py-1 z-20">
                          <span className="text-xs font-bold text-white tracking-wide">{vod.duration}</span>
                        </div>
                      </Link>

                      <div className="flex flex-col flex-1 py-1">
                        <Link href={`/vod/${vod.id}`} className="text-blue-400 hover:text-blue-300 font-medium text-lg leading-tight mb-2 transition-colors">
                          {vod.title}
                        </Link>
                        <div className="text-gray-400 text-sm mt-auto flex gap-4">
                          <span>{vod.date}</span>
                          {vod.youtubeId && (
                            <span className="flex items-center gap-1" title="Доступно на YouTube">
                               <div className="w-2 h-2 rounded-full bg-[#FF5252]"></div> YT
                            </span>
                          )}
                          {vod.vkId && (
                            <span className="flex items-center gap-1" title="Доступно в VK Видео">
                               <div className="w-2 h-2 rounded-full bg-[#2787F5]"></div> VK
                            </span>
                          )}
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
                
                {visibleCount < filteredVods.length && (
                  <button 
                    onClick={() => setVisibleCount(v => v + 24)}
                    className="mt-4 py-3 w-full max-w-sm mx-auto bg-[#1a1a1a] border border-[#333] text-gray-300 rounded hover:bg-[#222] transition-colors"
                  >
                    Показать еще ({filteredVods.length - visibleCount})
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#333] rounded p-6">
              <h2 className="text-lg font-bold text-white mb-6">Популярные темы и игры</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="bg-[#0d0d0d] border border-[#333] hover:border-blue-500 text-sm px-3 py-1.5 rounded-full transition-colors flex items-center gap-2"
                  >
                    <Hash className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-300">{tag}</span>
                    <span className="text-[#666] text-xs bg-[#111] px-1.5 rounded">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
