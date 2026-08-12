'use client';

import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

interface PlayerProps {
  src: string;
}

export default function Player({ src }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30, // Ограничиваем буфер для экономии трафика (и памяти)
      });
      
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        // Подключаем Plyr после парсинга манифеста для корректной работы выбора качества
        playerRef.current = new Plyr(video, defaultOptions);
      });
      
      return () => {
        hls.destroy();
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Для Safari, который поддерживает HLS нативно
      video.src = src;
      playerRef.current = new Plyr(video, defaultOptions);
      
      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    }
  }, [src]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden [&_.plyr]:w-full [&_.plyr]:h-full [&_.plyr__video-wrapper]:h-full [&_video]:!object-contain [&_video]:w-full [&_video]:h-full">
      <video ref={videoRef} className="plyr-react plyr" crossOrigin="anonymous"></video>
    </div>
  );
}
