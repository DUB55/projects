'use client';

import { useState, useEffect } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { Video } from '@/types/video';
import VideoCard from '@/components/VideoCard';
import { useRef } from 'react';

export default function HomePage() {
  const { videos: allVideosRaw } = useVideos();
  const [displayVideos, setDisplayVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const LIMIT = 12;

  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter for long-form videos only
  const allVideos = allVideosRaw.filter(v => v.type === 'video');

  // Reset when database (allVideos) changes
  useEffect(() => {
    setPage(1);
    setDisplayVideos(allVideos.slice(0, LIMIT));
  }, [allVideosRaw]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && displayVideos.length < allVideos.length) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [displayVideos.length, allVideos.length, loading]);

  const loadMore = () => {
    setLoading(true);
    // Remove artificial timeout for "fast as possible" loading
    const nextPage = page + 1;
    const nextVideos = allVideos.slice(0, nextPage * LIMIT);
    setDisplayVideos(nextVideos);
    setPage(nextPage);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          📺 Video Summaries
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Read concise summaries instead of watching full videos. Save time and learn faster.
        </p>
      </section>

      {/* Video Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎬</span>
            <span>Latest Summaries</span>
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {allVideos.length} summaries
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayVideos.map((video, index) => (
            <div
              key={video.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <VideoCard video={video} />
            </div>
          ))}
        </div>

        {displayVideos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">
              No videos found. {allVideos.length === 0 ? "Try importing some videos or checking your settings." : ""}
            </p>
          </div>
        )}


        {/* Infinite Scroll Trigger & Loading Indicator */}
        <div ref={observerTarget} className="py-12 flex justify-center">
          {displayVideos.length < allVideos.length && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 font-medium">Loading more...</p>
            </div>
          )}
          {displayVideos.length >= allVideos.length && allVideos.length > 0 && (
            <p className="text-gray-400 text-sm italic">You've reached the end of the collection.</p>
          )}
        </div>
      </section>
    </div>
  );
}
