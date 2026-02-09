import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Types for our Supabase tables (matching our internal Video type)
 */
export type DbVideo = {
    id: string;
    type: 'video' | 'short';
    title: string;
    channel: string;
    channel_id: string;
    thumbnail_url: string;
    source_url: string;
    duration: number | null;
    published_at: string;
    language: string;
    tags: string[];
    summary: any; // JSONB
    created_at: string;
};
