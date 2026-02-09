export interface Book {
    id: string;
    title: string;
    author: string;
    genre: string;
    coverUrl: string;
    publishedYear: number;
    tags: string[];
    oneLiner: string;
    summary: {
        overview: string;
        keyTakeaways: string[];
        detailedSummary: string;
        howToApply: string[];
        themes: string[];
        shortBulletSummary: string[];
        chapters?: { title: string; summary: string }[];
    };
    createdAt: string;
}
