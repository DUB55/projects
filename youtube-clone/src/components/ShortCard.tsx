'use client';

import Link from 'next/link';
import { Video } from '@/types/video';
import { formatDuration } from '@/lib/utils';
import { useState } from 'react';

interface ShortCardProps {
    video: Video;
}

export default function ShortCard({ video }: ShortCardProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <Link
            href={`/watch/${video.id}`}
            className="group block rounded-xl overflow-hidden bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl dark:hover:shadow-teal-900/20 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all duration-300 hover:-translate-y-1"
        >
            {/* Thumbnail - 9:16 aspect ratio for shorts */}
            <div className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {!imageError && (
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImageError(true)}
                    />
                )}

                {/* Duration Badge */}
                {video.duration && (
                    <div className="absolute bottom-16 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium rounded border border-white/10">
                        {formatDuration(video.duration)}
                    </div>
                )}

                {/* Shorts Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-lg flex items-center gap-1">
                    <span>⚡</span>
                    <span className="tracking-wide">SHORT</span>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent pt-10">
                    <h3 className="font-semibold text-white text-sm line-clamp-2 leading-snug group-hover:text-teal-400 transition-colors">
                        {video.title}
                    </h3>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-teal-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
        </Link>
    );
}
