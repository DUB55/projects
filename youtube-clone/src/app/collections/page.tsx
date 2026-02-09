'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { getAllTags, getVideosByTag, getVideos } from '@/lib/data';
import { useVideos } from '@/hooks/useVideos';
import { Video } from '@/types/video';
import VideoCard from '@/components/VideoCard';
import ShortCard from '@/components/ShortCard';
import TagChips from '@/components/TagChips';
import EmptyState from '@/components/EmptyState';

function CollectionsContent() {
    const searchParams = useSearchParams();
    const selectedTag = searchParams.get('tag') || '';
    const selectedType = searchParams.get('type') || 'all';

    const { videos: allVideos } = useVideos();
    const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
    const [tags, setTags] = useState<string[]>([]);

    // Extract tags dynamically from all available videos (including imported/edited)
    useEffect(() => {
        const uniqueTags = Array.from(new Set(allVideos.flatMap(v => v.tags))).sort();
        setTags(uniqueTags);
    }, [allVideos]);

    useEffect(() => {
        let result = allVideos;

        // Filter by Tag
        if (selectedTag) {
            result = result.filter(v => v.tags.includes(selectedTag));
        }

        // Filter by Type
        if (selectedType === 'video') {
            result = result.filter(v => v.type === 'video');
        } else if (selectedType === 'short') {
            result = result.filter(v => v.type === 'short');
        }

        setFilteredVideos(result);
    }, [selectedTag, selectedType, allVideos]);

    const videosList = filteredVideos.filter(v => v.type === 'video');
    const shortsList = filteredVideos.filter(v => v.type === 'short');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <section className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>📚</span>
                    <span>Collections</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Browse summaries by topic. Click a tag to filter.
                </p>
            </section>

            {/* Tag Filters */}
            <section className="mb-8">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    Filter by Topic
                </h2>
                <TagChips tags={tags} selectedTag={selectedTag} />
            </section>

            {/* Type Filters */}
            <section className="mb-8 flex gap-2">
                <TypeButton
                    label="All"
                    value="all"
                    selected={selectedType === 'all'}
                    tag={selectedTag}
                />
                <TypeButton
                    label="Videos"
                    value="video"
                    selected={selectedType === 'video'}
                    tag={selectedTag}
                    icon="🎬"
                />
                <TypeButton
                    label="Shorts"
                    value="short"
                    selected={selectedType === 'short'}
                    tag={selectedTag}
                    icon="⚡"
                />
            </section>

            {/* Results Count */}
            <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                {selectedTag ? (
                    <span>Showing {filteredVideos.length} results for &ldquo;{selectedTag}&rdquo;</span>
                ) : (
                    <span>Showing all {filteredVideos.length} summaries</span>
                )}
            </div>

            {/* Content */}
            {filteredVideos.length === 0 ? (
                <EmptyState
                    title="No summaries found"
                    message="No summaries match your current filters. Try a different combination."
                />
            ) : (
                <>
                    {/* Videos Section */}
                    {(selectedType === 'all' || selectedType === 'video') && videosList.length > 0 && (
                        <section className="mb-12">
                            {selectedType === 'all' && (
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span>🎬</span>
                                    <span>Videos ({videosList.length})</span>
                                </h2>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {videosList.map((video) => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Shorts Section */}
                    {(selectedType === 'all' || selectedType === 'short') && shortsList.length > 0 && (
                        <section>
                            {selectedType === 'all' && (
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span>⚡</span>
                                    <span>Shorts ({shortsList.length})</span>
                                </h2>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {shortsList.map((short) => (
                                    <ShortCard key={short.id} video={short} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

function TypeButton({
    label,
    value,
    selected,
    tag,
    icon
}: {
    label: string;
    value: string;
    selected: boolean;
    tag: string;
    icon?: string;
}) {
    const href = tag
        ? `/collections?tag=${encodeURIComponent(tag)}&type=${value}`
        : `/collections?type=${value}`;

    return (
        <a
            href={href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${selected
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
        >
            {icon && <span>{icon}</span>}
            <span>{label}</span>
        </a>
    );
}

export default function CollectionsPage() {
    return (
        <Suspense fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8" />
                    <div className="flex gap-2 mb-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        ))}
                    </div>
                </div>
            </div>
        }>
            <CollectionsContent />
        </Suspense>
    );
}
