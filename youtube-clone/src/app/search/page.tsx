'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { Video } from '@/types/video';
import VideoCard from '@/components/VideoCard';
import ShortCard from '@/components/ShortCard';
import EmptyState from '@/components/EmptyState';
import Fuse from 'fuse.js';

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const { videos: allVideos } = useVideos();
    const [results, setResults] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        const fuse = new Fuse(allVideos, {
            keys: [
                { name: 'title', weight: 0.7 },
                { name: 'summary.overview', weight: 0.4 },
                { name: 'tags', weight: 0.3 },
                { name: 'channel', weight: 0.2 },
                { name: 'summary.keyTakeaways', weight: 0.2 },
            ],
            threshold: 0.4,
            includeScore: true
        });

        const fuseResults = fuse.search(query);
        setResults(fuseResults.map(r => r.item));
        setLoading(false);
    }, [query, allVideos]);

    const videos = results.filter(r => r.type === 'video');
    const shorts = results.filter(r => r.type === 'short');

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!query) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmptyState
                    title="Search for summaries"
                    message="Enter a search term to find video summaries by title, channel, or topic."
                    showSearch={false}
                />
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmptyState
                    title="No results found"
                    message={`We couldn't find any summaries matching "${query}". Try different keywords.`}
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search Header */}
            <section className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Search Results for &ldquo;{query}&rdquo;
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Found {results.length} {results.length === 1 ? 'summary' : 'summaries'}
                </p>
            </section>

            {/* Videos */}
            {videos.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <span>🎬</span>
                        <span>Videos ({videos.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {videos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                </section>
            )}

            {/* Shorts */}
            {shorts.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <span>⚡</span>
                        <span>Shorts ({shorts.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {shorts.map((short) => (
                            <ShortCard key={short.id} video={short} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
