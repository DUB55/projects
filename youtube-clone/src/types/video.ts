// TypeScript interfaces for StreamSummarize data model

export interface Link {
    label: string;
    url: string;
}

export interface Chapter {
    timecode: string;
    title: string;
}

export interface Summary {
    overview: string;
    keyTakeaways: string[];
    chapters?: Chapter[];
    entities?: string[];
    links?: Link[];
    howToApply?: string[];
    shortBulletSummary?: string[];
    conciseCompleteSummary?: string;
}

export interface Video {
    id: string;
    type: 'video' | 'short';
    title: string;
    channel: string;
    channelId: string;
    thumbnailUrl: string;
    sourceUrl: string;
    duration?: number; // seconds
    publishedAt?: string; // ISO date
    language?: string;
    tags: string[];
    summary: Summary;
    createdAt?: string;
    videoNumber?: number;
    playlistName?: string;
    oneLiner?: string;
}

export interface Channel {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string;
}
