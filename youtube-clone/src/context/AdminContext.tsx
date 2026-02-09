'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Video } from '@/types/video';
import { supabase } from '@/lib/supabase';

interface AdminSettings {
    showMockData: boolean;
    autoThumbnails: boolean;
}

interface AdminContextType {
    isAdmin: boolean;
    settings: AdminSettings;
    hiddenVideoIds: string[];
    userHiddenVideoIds: string[];
    customTags: Record<string, string[]>; // videoId -> tags
    customThumbnails: Record<string, string>; // videoId -> dataUrl or URL
    login: (key: string) => boolean;
    logout: () => void;
    updateSettings: (newSettings: Partial<AdminSettings>) => void;
    toggleVideoVisibility: (videoId: string) => void;
    toggleUserVideoVisibility: (videoId: string) => void;
    addTagToVideo: (videoId: string, tag: string) => void;
    removeTagFromVideo: (videoId: string, tag: string) => void;
    setCustomThumbnail: (videoId: string, thumbUrl: string) => void;
    restoreVideo: (videoId: string) => void;
    isLoaded: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'stream_admin_auth';
const SETTINGS_STORAGE_KEY = 'stream_admin_settings';
const HIDDEN_VIDEOS_KEY = 'stream_hidden_videos';
const USER_HIDDEN_VIDEOS_KEY = 'stream_user_hidden_videos';
const CUSTOM_TAGS_KEY = 'stream_custom_tags';
const CUSTOM_THUMBS_KEY = 'stream_custom_thumbs';
const SECRET_KEY = 'admin123';

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [settings, setSettings] = useState<AdminSettings>({
        showMockData: false, // Default to false to prevent flickering
        autoThumbnails: true,
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [hiddenVideoIds, setHiddenVideoIds] = useState<string[]>([]);
    const [userHiddenVideoIds, setUserHiddenVideoIds] = useState<string[]>([]);
    const [customTags, setCustomTags] = useState<Record<string, string[]>>({});
    const [customThumbnails, setCustomThumbnails] = useState<Record<string, string>>({});

    useEffect(() => {
        async function initialize() {
            // 1. Load from localStorage (Fast Fallback)
            const auth = localStorage.getItem(ADMIN_STORAGE_KEY);
            if (auth === 'true') setIsAdmin(true);

            const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                try {
                    setSettings(JSON.parse(storedSettings));
                } catch (e) {
                    console.error('Failed to parse local settings:', e);
                }
            }

            // Load other local-only states
            const storedHidden = localStorage.getItem(HIDDEN_VIDEOS_KEY);
            if (storedHidden) setHiddenVideoIds(JSON.parse(storedHidden));
            const storedUserHidden = localStorage.getItem(USER_HIDDEN_VIDEOS_KEY);
            if (storedUserHidden) setUserHiddenVideoIds(JSON.parse(storedUserHidden));
            const storedTags = localStorage.getItem(CUSTOM_TAGS_KEY);
            if (storedTags) setCustomTags(JSON.parse(storedTags));
            const storedThumbs = localStorage.getItem(CUSTOM_THUMBS_KEY);
            if (storedThumbs) setCustomThumbnails(JSON.parse(storedThumbs));

            // 2. Load Global Settings from Supabase (Source of Truth)
            try {
                console.log('Fetching global settings...');
                const { data, error } = await supabase
                    .from('site_settings')
                    .select('key, value');

                if (error) throw error;

                if (data && data.length > 0) {
                    const globalSettings: any = {};
                    data.forEach(item => {
                        globalSettings[item.key] = item.value;
                    });

                    console.log('Global settings received:', globalSettings);

                    setSettings(prev => {
                        const updated = { ...prev };
                        if (globalSettings.showMockData !== undefined) {
                            updated.showMockData = Boolean(globalSettings.showMockData);
                        }
                        if (globalSettings.autoThumbnails !== undefined) {
                            updated.autoThumbnails = Boolean(globalSettings.autoThumbnails);
                        }

                        // Sync back to local storage so it's ready for next refresh immediately
                        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
                        return updated;
                    });
                } else {
                    console.log('No global settings found, using local/defaults.');
                }
            } catch (err) {
                console.warn('Failed to fetch global settings (using defaults):', err);
            } finally {
                setIsLoaded(true);
            }
        }

        initialize();
    }, []);

    const login = (key: string) => {
        if (key === SECRET_KEY) {
            setIsAdmin(true);
            localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        localStorage.removeItem(ADMIN_STORAGE_KEY);
    };

    const updateSettings = async (newSettings: Partial<AdminSettings>) => {
        // 1. Immediate local state update for snappy UI
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

        // 2. Sync to Supabase if Admin
        if (isAdmin) {
            try {
                console.log('Syncing updated settings to Supabase...', newSettings);
                const upserts = Object.entries(newSettings).map(([key, value]) =>
                    supabase
                        .from('site_settings')
                        .upsert({ key, value })
                );

                const results = await Promise.all(upserts);
                const errors = results.filter(r => r.error);

                if (errors.length > 0) {
                    console.error('Some settings failed to sync:', errors);
                } else {
                    console.log('Global settings successfully synced.');
                }
            } catch (err) {
                console.error('Sync process error:', err);
            }
        }
    };

    const toggleVideoVisibility = (videoId: string) => {
        setHiddenVideoIds(prev => {
            const newHidden = prev.includes(videoId)
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId];
            localStorage.setItem(HIDDEN_VIDEOS_KEY, JSON.stringify(newHidden));
            return newHidden;
        });
    };

    const toggleUserVideoVisibility = (videoId: string) => {
        setUserHiddenVideoIds(prev => {
            const newHidden = prev.includes(videoId)
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId];
            localStorage.setItem(USER_HIDDEN_VIDEOS_KEY, JSON.stringify(newHidden));
            return newHidden;
        });
    };

    const restoreVideo = (videoId: string) => {
        setHiddenVideoIds(prev => {
            const newHidden = prev.filter(id => id !== videoId);
            localStorage.setItem(HIDDEN_VIDEOS_KEY, JSON.stringify(newHidden));
            return newHidden;
        });
    };

    const addTagToVideo = (videoId: string, tag: string) => {
        setCustomTags(prev => {
            const currentTags = prev[videoId] || [];
            if (currentTags.includes(tag)) return prev;

            const newTags = {
                ...prev,
                [videoId]: [...currentTags, tag]
            };
            localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(newTags));
            return newTags;
        });
    };

    const removeTagFromVideo = (videoId: string, tag: string) => {
        setCustomTags(prev => {
            const currentTags = prev[videoId] || [];
            const newTags = {
                ...prev,
                [videoId]: currentTags.filter(t => t !== tag)
            };
            localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(newTags));
            return newTags;
        });
    };

    const setCustomThumbnail = (videoId: string, thumbUrl: string) => {
        setCustomThumbnails(prev => {
            const newThumbs = {
                ...prev,
                [videoId]: thumbUrl
            };
            localStorage.setItem(CUSTOM_THUMBS_KEY, JSON.stringify(newThumbs));
            return newThumbs;
        });
    };

    return (
        <AdminContext.Provider value={{
            isAdmin,
            settings,
            hiddenVideoIds,
            userHiddenVideoIds,
            customTags,
            customThumbnails,
            login,
            logout,
            updateSettings,
            toggleVideoVisibility,
            toggleUserVideoVisibility,
            addTagToVideo,
            removeTagFromVideo,
            setCustomThumbnail,
            restoreVideo,
            isLoaded
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
