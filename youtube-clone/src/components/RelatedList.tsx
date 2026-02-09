'use client';

import Link from 'next/link';
import { Video } from '@/types/video';
import { formatDuration } from '@/lib/utils';
import { useState } from 'react';

interface RelatedListProps {
    videos: Video[];
    title?: string;
}

function RelatedCard({ video }: { video: Video }) {
    const [imageError, setImageError] = useState(false);

    return (
        <Link
            href={`/watch/${video.id}`}
            className="flex gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
            {/* Mini Thumbnail */}
            <div className="flex-shrink-0 w-28 aspect-video bg-gradient-to-br from-teal-500/30 to-purple-500/30 rounded-lg overflow-hidden relative">
                {!imageError && (
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                )}
                {video.duration && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[10px] rounded">
                        {formatDuration(video.duration)}
                    </span>
                )}
                {video.type === 'short' && (
                    <span className="absolute top-1 left-1 px-1 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                        ⚡
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {video.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {video.channel}
                </p>
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-teal-600 dark:text-teal-400">📝 Summary</span>
                </div>
            </div>
        </Link>
    );
}

export default function RelatedList({ videos, title = "Related Summaries" }: RelatedListProps) {
    if (videos.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📚</span>
                <span>{title}</span>
            </h2>

            <div className="space-y-2">
                {videos.map((video) => (
                    <RelatedCard key={video.id} video={video} />
                ))}
            </div>
        </div>
    );
}
