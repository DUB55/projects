import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';
import { Video } from '@/types/video';
import { getAllVideos } from './data';

// Fuse.js configuration for searching videos
const fuseOptions: IFuseOptions<Video> = {
    keys: [
        { name: 'title', weight: 0.4 },
        { name: 'channel', weight: 0.2 },
        { name: 'tags', weight: 0.2 },
        { name: 'summary.overview', weight: 0.15 },
        { name: 'summary.keyTakeaways', weight: 0.05 }
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true
};

let fuseInstance: Fuse<Video> | null = null;

/**
 * Get or create Fuse instance (lazy initialization)
 */
function getFuseInstance(): Fuse<Video> {
    if (!fuseInstance) {
        const videos = getAllVideos();
        fuseInstance = new Fuse(videos, fuseOptions);
    }
    return fuseInstance;
}

/**
 * Reset fuse instance (call when data changes)
 */
export function resetSearchIndex(): void {
    fuseInstance = null;
}

/**
 * Search videos with query
 */
export function searchVideos(query: string): Video[] {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const fuse = getFuseInstance();
    const results = fuse.search(query.trim());

    return results.map(result => result.item);
}

/**
 * Search with metadata (includes match info)
 */
export function searchVideosWithMeta(query: string): FuseResult<Video>[] {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const fuse = getFuseInstance();
    return fuse.search(query.trim());
}
