import { Video, Channel } from '@/types/video';
import videosData from '@/data/videos';

// Pagination defaults
const DEFAULT_LIMIT = 12;

/**
 * Get paginated videos
 */
export function getVideos(
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
    type?: 'video' | 'short'
): { videos: Video[]; hasMore: boolean; total: number } {
    let filtered = videosData;

    if (type) {
        filtered = filtered.filter(v => v.type === type);
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const videos = filtered.slice(start, end);

    return {
        videos,
        hasMore: end < filtered.length,
        total: filtered.length
    };
}

/**
 * Get a single video by ID
 */
export function getVideoById(id: string): Video | undefined {
    return videosData.find(v => v.id === id);
}

/**
 * Get all videos by a specific channel
 */
export function getVideosByChannel(
    channelId: string,
    type?: 'video' | 'short'
): Video[] {
    let filtered = videosData.filter(v => v.channelId === channelId);

    if (type) {
        filtered = filtered.filter(v => v.type === type);
    }

    return filtered;
}

/**
 * Get related videos based on shared tags or same channel
 */
export function getRelatedVideos(video: Video, limit: number = 5): Video[] {
    const related = videosData
        .filter(v => v.id !== video.id)
        .map(v => {
            // Score based on shared tags and same channel
            let score = 0;

            if (v.channelId === video.channelId) {
                score += 3;
            }

            const sharedTags = v.tags.filter(tag => video.tags.includes(tag));
            score += sharedTags.length;

            return { video: v, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.video);

    return related;
}

/**
 * Get unique channels from videos
 */
export function getChannels(): Channel[] {
    const channelMap = new Map<string, Channel>();

    videosData.forEach(v => {
        if (!channelMap.has(v.channelId)) {
            channelMap.set(v.channelId, {
                id: v.channelId,
                name: v.channel,
            });
        }
    });

    return Array.from(channelMap.values());
}

/**
 * Get channel by ID
 */
export function getChannelById(channelId: string): Channel | undefined {
    const channel = getChannels().find(c => c.id === channelId);
    return channel;
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
    const tagSet = new Set<string>();

    videosData.forEach(v => {
        v.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
}

/**
 * Get videos by tag
 */
export function getVideosByTag(tag: string, type?: 'video' | 'short'): Video[] {
    let filtered = videosData.filter(v => v.tags.includes(tag));

    if (type) {
        filtered = filtered.filter(v => v.type === type);
    }

    return filtered;
}

/**
 * Get all videos (for search/admin)
 */
export function getAllVideos(): Video[] {
    return videosData;
}
