'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useVideos } from '@/hooks/useVideos';
import { useAdmin } from '@/context/AdminContext';
import { getRelatedVideos } from '@/lib/data';
import SummaryPanel from '@/components/SummaryPanel';
import RelatedList from '@/components/RelatedList';
import { formatDuration, generateInitials, stringToColor } from '@/lib/utils';
import { Video } from '@/types/video';

interface WatchPageProps {
    params: Promise<{ id: string }>;
}

export default function WatchPage({ params }: WatchPageProps) {
    const { id } = use(params);
    const { videos, loading } = useVideos();
    const { settings } = useAdmin();

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading summary...</p>
            </div>
        );
    }

    const decodedId = decodeURIComponent(id).trim();
    const video = videos.find(v =>
        v.id === decodedId ||
        v.id === id ||
        v.id.trim() === decodedId ||
        v.id.toLowerCase() === decodedId.toLowerCase()
    );


    if (!video) {
        notFound();
    }

    const related = getRelatedVideos(video, 5);
    const channelColor = stringToColor(video.channel);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Header */}
                    <div className="bg-gradient-to-br from-teal-500/10 to-purple-500/10 dark:from-teal-500/20 dark:to-purple-500/20 rounded-3xl p-6 sm:p-8">
                        {/* Type Badge */}
                        <div className="flex items-center gap-2 mb-4">
                            {video.type === 'short' ? (
                                <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                                    <span>⚡</span> Short
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-teal-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                                    <span>📺</span> Video
                                </span>
                            )}
                            {video.duration && (
                                <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full backdrop-blur-sm">
                                    {formatDuration(video.duration)}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                            {video.title}
                        </h1>

                        {/* Channel Info */}
                        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <Link
                                href={`/channel/${video.channelId}`}
                                className="inline-flex items-center gap-3 group"
                            >
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner"
                                    style={{ backgroundColor: channelColor }}
                                >
                                    {generateInitials(video.channel)}
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                        {video.channel}
                                    </span>
                                    <span className="text-xs text-gray-500">Official Channel</span>
                                </div>
                            </Link>

                            <a
                                href={video.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm flex items-center gap-2"
                            >
                                <span>🔗</span> Watch Original
                            </a>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {video.tags.map((tag) => (
                                <Link
                                    key={tag}
                                    href={`/collections?tag=${encodeURIComponent(tag)}`}
                                    className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-sm transition-colors border border-gray-200/20"
                                >
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <SummaryPanel video={video} />
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Related Summaries</h3>
                            <RelatedList videos={related} />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
