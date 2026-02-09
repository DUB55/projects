'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { useVideos } from '@/hooks/useVideos';
import { generateInitials, stringToColor } from '@/lib/utils';
import VideoCard from '@/components/VideoCard';
import ShortCard from '@/components/ShortCard';
import EmptyState from '@/components/EmptyState';
import { Channel } from '@/types/video';

interface ChannelPageProps {
    params: Promise<{ channelId: string }>;
}

export default function ChannelPage({ params }: ChannelPageProps) {
    const { channelId } = use(params);
    const { videos: allVideos, loading } = useVideos();

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium tracking-wide">Loading channel...</p>
            </div>
        );
    }

    // Filter content for this channel
    const channelVideos = allVideos.filter(v => v.channelId === channelId && v.type === 'video');
    const channelShorts = allVideos.filter(v => v.channelId === channelId && v.type === 'short');

    // Discover channel info from the videos
    const firstFound = allVideos.find(v => v.channelId === channelId);

    if (!firstFound && channelVideos.length === 0 && channelShorts.length === 0) {
        notFound();
    }

    const channelName = firstFound?.channel || 'Unknown Channel';
    const channelDescription = (firstFound as any)?.channelDescription || '';
    const channelColor = stringToColor(channelName);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Channel Header */}
            <section className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 dark:from-teal-500/20 dark:to-indigo-500/20 rounded-3xl p-8 mb-12 border border-white dark:border-gray-800 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div
                        className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-2xl ring-4 ring-white dark:ring-gray-800"
                        style={{ backgroundColor: channelColor }}
                    >
                        {generateInitials(channelName)}
                    </div>

                    {/* Info */}
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                            {channelName}
                        </h1>
                        {channelDescription && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl text-lg leading-relaxed">
                                {channelDescription}
                            </p>
                        )}
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                            <span className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-sm backdrop-blur-sm border border-white dark:border-gray-700/50">
                                <span className="text-teal-500">🎬</span>
                                <span>{channelVideos.length} Videos</span>
                            </span>
                            <span className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-sm backdrop-blur-sm border border-white dark:border-gray-700/50">
                                <span className="text-red-500">⚡</span>
                                <span>{channelShorts.length} Shorts</span>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Videos Section */}
            {channelVideos.length > 0 && (
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-1 h-8 bg-teal-500 rounded-full" />
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            Video Summaries
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {channelVideos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                </section>
            )}

            {/* Shorts Section */}
            {channelShorts.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-1 h-8 bg-red-500 rounded-full" />
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            Short Highlights
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {channelShorts.map((short) => (
                            <ShortCard key={short.id} video={short} />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {channelVideos.length === 0 && channelShorts.length === 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <EmptyState
                        title="No content discovered"
                        message="This channel doesn't have any summarized content in our database yet."
                    />
                </div>
            )}
        </div>
    );
}
