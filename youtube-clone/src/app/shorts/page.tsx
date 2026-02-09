'use client';

import { useState, useEffect } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { Video } from '@/types/video';
import ShortCard from '@/components/ShortCard';
import { useRef } from 'react';

export default function ShortsPage() {
    const { videos: allVideosRaw } = useVideos();
    const [displayShorts, setDisplayShorts] = useState<Video[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const LIMIT = 12;

    const observerTarget = useRef<HTMLDivElement>(null);

    const allShorts = allVideosRaw.filter(v => v.type === 'short');

    useEffect(() => {
        setPage(1);
        setDisplayShorts(allShorts.slice(0, LIMIT));
    }, [allVideosRaw]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && displayShorts.length < allShorts.length) {
                    loadMore();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [displayShorts.length, allShorts.length, loading]);

    const loadMore = () => {
        setLoading(true);
        const nextPage = page + 1;
        const nextShorts = allShorts.slice(0, nextPage * LIMIT);
        setDisplayShorts(nextShorts);
        setPage(nextPage);
        setLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <section className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-2">
                    <span className="text-red-500">⚡</span>
                    <span>Short Summaries</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Quick summaries of short-form content. Perfect for learning on the go.
                </p>
            </section>

            {/* Shorts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayShorts.map((short, index) => (
                    <div
                        key={short.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <ShortCard video={short} />
                    </div>
                ))}
            </div>

            {displayShorts.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">
                        No shorts found. {allShorts.length === 0 ? "Try importing some shorts." : ""}
                    </p>
                </div>
            )}


            {/* Infinite Scroll Trigger & Loading Indicator */}
            <div ref={observerTarget} className="py-12 flex justify-center">
                {displayShorts.length < allShorts.length && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 font-medium">Loading more...</p>
                    </div>
                )}
                {displayShorts.length >= allShorts.length && allShorts.length > 0 && (
                    <p className="text-gray-400 text-sm italic">That's all the shorts for now!</p>
                )}
            </div>
        </div>
    );
}
