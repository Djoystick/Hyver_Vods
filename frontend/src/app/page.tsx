'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Clock, Eye, Search } from "lucide-react";

const DUMMY_VODS = [
  { id: 1, title: "ИГРАЕМ В НОВЫЙ ХОРРОР | ПУГАЕМСЯ ВМЕСТЕ", date: "12 Авг 2026", duration: "4:23:15", views: "12.4k", thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop" },
  { id: 2, title: "ЧИЛЛ СТРИМ | ОБЩЕНИЕ И РЕАКЦИИ", date: "10 Авг 2026", duration: "6:15:00", views: "18.2k", thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800&auto=format&fit=crop" },
  { id: 3, title: "ПРОХОДИМ ELDEN RING | БОССЫ И БОЛЬ", date: "08 Авг 2026", duration: "8:42:10", views: "25.1k", thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop" },
  { id: 4, title: "СМОТРИМ КИНО С ЧАТОМ", date: "05 Авг 2026", duration: "3:10:05", views: "15.8k", thumbnail: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=800&auto=format&fit=crop" },
  { id: 5, title: "СЮЖЕТОЧКА НА ВЕЧЕР", date: "03 Авг 2026", duration: "5:30:22", views: "11.2k", thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop" },
  { id: 6, title: "ПОДКАСТ ПРО ИГРЫ И ЖИЗНЬ", date: "01 Авг 2026", duration: "2:45:30", views: "19.5k", thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=800&auto=format&fit=crop" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 p-4">
        <div className="glassmorphism rounded-2xl max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <Play className="text-white w-5 h-5 fill-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">VOD <span className="text-violet-400">Hyver</span></h1>
          </div>
          
          <div className="hidden md:flex relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Поиск стримов..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-4">
            <button className="text-sm font-medium hover:text-violet-400 transition-colors">Архив</button>
            <button className="text-sm font-medium hover:text-violet-400 transition-colors">Клипы</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-bold mb-4 neon-text">Последние записи</h2>
          <p className="text-gray-400">Архив стримов в высоком качестве без тормозов.</p>
        </motion.div>

        {/* VOD Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DUMMY_VODS.map((vod, index) => (
            <Link href={`/vod/${vod.id}`} key={vod.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="glassmorphism rounded-2xl overflow-hidden group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={vod.thumbnail} 
                    alt={vod.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-violet-600/80 backdrop-blur flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                      <Play className="text-white w-6 h-6 fill-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {vod.duration}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-3 line-clamp-2 leading-tight group-hover:text-violet-400 transition-colors">
                    {vod.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{vod.date}</span>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {vod.views}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
