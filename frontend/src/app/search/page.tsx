'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Clock, Eye, Search, ArrowLeft } from "lucide-react";
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
  
  useEffect(() => {
    fetch('/data/vods.json')
      .then(res => res.json())
      .then(data => setAllVods(data))
      .catch(err => console.error(err));
  }, []);

  const filteredVods = allVods.filter(vod => 
    vod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    vod.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 p-4">
        <div className="glassmorphism rounded-2xl max-w-[1920px] mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-violet-600 transition-colors flex items-center justify-center">
              <ArrowLeft className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">На главную</h1>
          </Link>
          
          <div className="flex-grow max-w-2xl mx-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или игре..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-base focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">Архив стримов</h2>
          <p className="text-gray-400">Найдено записей: {filteredVods.length}</p>
        </motion.div>

        {/* VOD Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredVods.map((vod, index) => (
            <Link href={`/vod/${vod.id}`} key={vod.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative rounded-2xl overflow-hidden glassmorphism border border-white/5 hover:border-violet-500/50 transition-colors cursor-pointer"
              >
                <div className="relative aspect-video">
                  <img src={vod.thumbnail} alt={vod.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {vod.duration}
                  </div>
                  <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                    {vod.category}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">{vod.title}</h3>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>{vod.date}</span>
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {vod.views}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
        
        {filteredVods.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Ничего не найдено. Попробуйте изменить запрос.
          </div>
        )}
      </main>
    </div>
  );
}
