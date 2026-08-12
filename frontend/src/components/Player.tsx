'use client';

import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

interface PlayerProps {
  src: string;
  type?: 'hls' | 'youtube';
}

export default function Player({ src, type = 'hls' }: PlayerProps) {
  const containerRef = useRef<HTMLVideoElement | HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const defaultOptions: Plyr.Options = {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      settings: ['quality', 'speed'],
    };

    if (type === 'youtube') {
      playerRef.current = new Plyr(el, defaultOptions);
      return () => {
        if (playerRef.current) playerRef.current.destroy();
      };
    }

    if (Hls.isSupported() && el instanceof HTMLVideoElement) {
      const hls = new Hls({
        maxMaxBufferLength: 30, // Ограничиваем буфер для экономии трафика (и памяти)
      });
      
      hls.loadSource(src);
      hls.attachMedia(el);
      
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        // Подключаем Plyr после парсинга манифеста для корректной работы выбора качества
        playerRef.current = new Plyr(el, defaultOptions);
      });
      
      return () => {
        hls.destroy();
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    } else if (el instanceof HTMLVideoElement && el.canPlayType('application/vnd.apple.mpegurl')) {
      // Для Safari, который поддерживает HLS нативно
      el.src = src;
      playerRef.current = new Plyr(el, defaultOptions);
      
      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    }
  }, [src, type]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden [&_.plyr]:w-full [&_.plyr]:h-full [&_.plyr__video-wrapper]:h-full [&_video]:!object-contain [&_video]:w-full [&_video]:h-full">
      {type === 'youtube' ? (
        <div ref={containerRef as React.RefObject<HTMLDivElement>} className="plyr-react plyr" data-plyr-provider="youtube" data-plyr-embed-id={src}></div>
      ) : (
        <video ref={containerRef as React.RefObject<HTMLVideoElement>} className="plyr-react plyr" crossOrigin="anonymous"></video>
      )}
    </div>
  );
}
