'use client';

import Link from 'next/link';
import { Video } from '@/types/video';
import { formatDuration } from '@/lib/utils';
import { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

interface VideoCardProps {
    video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
    const [imageError, setImageError] = useState(false);
    const {
        isAdmin,
        toggleVideoVisibility,
        toggleUserVideoVisibility,
        addTagToVideo,
        settings
    } = useAdmin();
    const [showTagInput, setShowTagInput] = useState(false);
    const [newTag, setNewTag] = useState('');

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTag.trim()) {
            addTagToVideo(video.id, newTag.trim());
            setNewTag('');
            setShowTagInput(false);
        }
    };

    // Thumbnail logic
    const getYouTubeThumb = (url: string) => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
        return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
    };

    const ytThumb = getYouTubeThumb(video.sourceUrl);
    const isDefaultThumb = video.thumbnailUrl === '/thumbs/default.jpg';

    const displayThumbUrl = (settings.autoThumbnails && (imageError || isDefaultThumb) && ytThumb)
        ? ytThumb
        : video.thumbnailUrl;

    return (
        <div className="relative group block">
            {/* Control Buttons Overlay */}
            <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Admin Specific Controls */}
                {isAdmin && (
                    <>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                toggleVideoVisibility(video.id);
                            }}
                            className="p-1.5 bg-red-600/90 backdrop-blur-sm text-white rounded text-[10px] font-bold hover:bg-red-700 shadow-sm flex items-center gap-1"
                            title="Admin Hide (Global)"
                        >
                            <span>🚫</span>
                            <span>Admin Hide</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                // This will eventually open the Thumbnail Maker modal
                                window.dispatchEvent(new CustomEvent('open-thumbnail-maker', { detail: video }));
                            }}
                            className="p-1.5 bg-indigo-600/90 backdrop-blur-sm text-white rounded text-[10px] font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1"
                            title="Edit Thumbnail"
                        >
                            <span>🎨</span>
                            <span>Edit Thumb</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setShowTagInput(!showTagInput);
                            }}
                            className="p-1.5 bg-teal-600/90 backdrop-blur-sm text-white rounded text-[10px] font-bold hover:bg-teal-700 shadow-sm flex items-center gap-1"
                            title="Add Tag"
                        >
                            <span>🏷️</span>
                            <span>Tag</span>
                        </button>
                    </>
                )}

                {/* User Specific Control */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        toggleUserVideoVisibility(video.id);
                    }}
                    className="p-1.5 bg-gray-800/90 backdrop-blur-sm text-white rounded text-[10px] font-bold hover:bg-black shadow-sm flex items-center justify-center min-w-[50px]"
                    title="Hide for me"
                >
                    <span>Hide</span>
                </button>
            </div>

            {/* Tag Input Overlay */}
            {showTagInput && (
                <div className="absolute top-12 right-2 z-30 bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 w-40">
                    <form onSubmit={handleAddTag}>
                        <input
                            autoFocus
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="New tag..."
                            className="w-full text-xs p-1 border rounded bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white mb-1"
                        />
                        <button
                            type="submit"
                            className="w-full text-xs bg-blue-500 text-white rounded py-1 hover:bg-blue-600"
                        >
                            Add
                        </button>
                    </form>
                </div>
            )}

            <Link
                href={`/watch/${video.id}`}
                className="block rounded-xl overflow-hidden bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 shadow-sm hover:shadow-xl dark:hover:shadow-teal-900/20 transition-all duration-300 hover:-translate-y-1 group"
            >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img
                        src={displayThumbUrl}
                        alt={video.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImageError(true)}
                    />

                    {/* Duration Badge */}
                    {video.duration && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium rounded border border-white/10">
                            {formatDuration(video.duration)}
                        </div>
                    )}

                    {/* Summary Available Badge REMOVED */}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-4">
                    {(video.videoNumber || video.playlistName) && (
                        <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">
                            {video.playlistName && <span className="opacity-80">{video.playlistName}</span>}
                            {video.videoNumber && <span className="bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">#{video.videoNumber}</span>}
                        </div>
                    )}

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {video.title}
                    </h3>

                    <div className="flex items-center justify-between mt-3">
                        {/* Channel Name REMOVED */}
                        {video.oneLiner && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full font-medium border border-purple-100 dark:border-purple-800/50">
                                One-Liner
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800/50">
                        {video.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-[10px] bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-100 dark:border-gray-700 font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                        {video.tags.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                +{video.tags.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
