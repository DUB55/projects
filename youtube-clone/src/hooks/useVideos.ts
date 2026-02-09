import { useState, useEffect } from 'react';
import { Video } from '@/types/video';
import { useAdmin } from '@/context/AdminContext';
import { videoDb } from '@/lib/db';
import { supabase, DbVideo } from '@/lib/supabase';
import { getAllVideos as getStaticVideos } from '@/lib/data';

export function useVideos() {
    const { settings, hiddenVideoIds, userHiddenVideoIds, customTags, customThumbnails, isLoaded } = useAdmin();
    const [processedVideos, setProcessedVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAndProcess() {
            setLoading(true);

            // 1. Get Global Data from Supabase
            let globalVideos: Video[] = [];
            try {
                const { data, error } = await supabase
                    .from('videos')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data && !error) {
                    globalVideos = data.map((v: DbVideo) => ({
                        id: v.id,
                        type: v.type,
                        title: v.title,
                        channel: v.channel,
                        channelId: v.channel_id,
                        thumbnailUrl: v.thumbnail_url,
                        sourceUrl: v.source_url,
                        duration: v.duration || undefined,
                        publishedAt: v.published_at,
                        language: v.language,
                        tags: v.tags,
                        summary: v.summary,
                        createdAt: v.created_at
                    }));
                }
            } catch (err) {
                console.warn('Supabase fetch failed or not configured', err);
            }

            // 2. Get data from IndexedDB (fallback / local cache)
            let localVideos: Video[] = [];
            try {
                localVideos = await videoDb.getAllVideos();
            } catch (err) {
                console.error('Failed to load videos from IndexedDB', err);
            }

            // Combine arrays (Mock < Local < Global priority)
            const staticList = settings.showMockData ? getStaticVideos() : [];
            const combined = [...staticList, ...localVideos, ...globalVideos];

            // Unique by ID (Later items in combined overwrite earlier ones, Global > Local > Static)
            const idMap = new Map<string, Video>();
            combined.forEach(v => {
                if (v && v.id) {
                    idMap.set(v.id, v);
                }
            });
            const unique = Array.from(idMap.values());

            // 3. Filter hidden videos (both Admin and User)
            const visible = unique.filter(v =>
                !hiddenVideoIds.includes(v.id) &&
                !userHiddenVideoIds.includes(v.id)
            );

            // 4. Apply custom tags and thumbnails
            const processed = visible.map(v => {
                let updated = { ...v };

                // Tags
                const extraTags = customTags[v.id] || [];
                if (extraTags.length > 0) {
                    updated.tags = Array.from(new Set([...v.tags, ...extraTags]));
                }

                // Thumbnails
                const customThumb = customThumbnails[v.id];
                if (customThumb) {
                    updated.thumbnailUrl = customThumb;
                }

                return updated;
            });

            setProcessedVideos(processed);
            setLoading(false);
        }

        loadAndProcess();
    }, [isLoaded, settings.showMockData, hiddenVideoIds, userHiddenVideoIds, customTags, customThumbnails]);

    return { videos: processedVideos, loading };
}
