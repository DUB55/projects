'use client';

import { useAdmin } from '@/context/AdminContext';
import { useRouter, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { videoDb } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export default function AdminSettingsPage() {
    const {
        isAdmin,
        settings,
        updateSettings,
        hiddenVideoIds,
        userHiddenVideoIds,
        customThumbnails,
        toggleUserVideoVisibility,
        setCustomThumbnail,
        restoreVideo,
        logout
    } = useAdmin();
    const router = useRouter();
    const { videos } = useVideos();
    const [mounted, setMounted] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!isAdmin) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Admin Settings</span>
                </h1>
                <button
                    onClick={() => {
                        logout();
                        router.push('/');
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    Logout
                </button>
            </div>

            <div className="grid gap-8">
                {/* General Settings */}
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        General Configuration
                    </h2>

                    <div className="space-y-4">
                        {/* Show Mock Data Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Show Mock Data</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Enable or disable the initial seed data.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showMockData}
                                    onChange={(e) => updateSettings({ showMockData: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                            </label>
                        </div>

                        {/* Auto Thumbnails Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Auto-Fetch Thumbnails</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Automatically generate thumbnails from YouTube URLs if custom ones are missing.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoThumbnails}
                                    onChange={(e) => updateSettings({ autoThumbnails: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Global Data Sync */}
                <section className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <span>🌐</span>
                        <span>Global Database Sync</span>
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Push your local IndexedDB videos to the global Supabase database to make them visible to all users.
                    </p>

                    <button
                        onClick={async () => {
                            setSyncing(true);
                            setSyncResult(null);
                            try {
                                const localVideos = await videoDb.getAllVideos();
                                if (localVideos.length === 0) {
                                    setSyncResult("No local videos to sync.");
                                } else {
                                    const dbVideos = localVideos.map(v => ({
                                        id: v.id,
                                        type: v.type,
                                        title: v.title,
                                        channel: v.channel,
                                        channel_id: v.channelId,
                                        thumbnail_url: v.thumbnailUrl,
                                        source_url: v.sourceUrl,
                                        duration: v.duration,
                                        published_at: v.publishedAt,
                                        language: v.language,
                                        tags: v.tags,
                                        summary: v.summary,
                                        created_at: v.createdAt
                                    }));

                                    const { error } = await supabase.from('videos').upsert(dbVideos);
                                    if (error) throw error;
                                    setSyncResult(`Successfully synced ${localVideos.length} videos to global!`);
                                }
                            } catch (err: any) {
                                console.error(err);
                                setSyncResult(`Sync failed: ${err.message || "Unknown error"}`);
                            }
                            setSyncing(false);
                        }}
                        disabled={syncing}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {syncing ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span>🚀 Push Local to Global</span>
                        )}
                    </button>

                    {syncResult && (
                        <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${syncResult.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {syncResult}
                        </div>
                    )}
                </section>

                {/* Admin Hidden Videos */}
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Admin Hidden (Global) ({hiddenVideoIds.length})
                    </h2>

                    {hiddenVideoIds.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                            No videos are hidden globally.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {hiddenVideoIds.map(id => {
                                const video = videos.find(v => v.id === id);
                                const title = video ? video.title : id;
                                return (
                                    <div key={id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[70%]">
                                            {title}
                                        </span>
                                        <button
                                            onClick={() => restoreVideo(id)}
                                            className="px-3 py-1 text-sm bg-teal-100 hover:bg-teal-200 text-teal-700 dark:bg-teal-900/50 dark:hover:bg-teal-900 dark:text-teal-300 rounded transition-colors"
                                        >
                                            Restore
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* User Hidden Videos */}
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 font-inter">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        User Hidden (Local) ({userHiddenVideoIds.length})
                    </h2>

                    {userHiddenVideoIds.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                            You haven't hidden any videos for yourself.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {userHiddenVideoIds.map(id => {
                                const video = videos.find(v => v.id === id);
                                const title = video ? video.title : id;
                                return (
                                    <div key={id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[70%]">
                                            {title}
                                        </span>
                                        <button
                                            onClick={() => toggleUserVideoVisibility(id)}
                                            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded transition-colors"
                                        >
                                            Un-hide
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Custom Thumbnails */}
                {Object.keys(customThumbnails).length > 0 && (
                    <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Custom Thumbnails ({Object.keys(customThumbnails).length})
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(customThumbnails).map(([id, url]) => {
                                const video = videos.find(v => v.id === id);
                                return (
                                    <div key={id} className="group relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <img src={url} alt={id} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                                            <p className="text-[10px] text-white font-bold mb-2 truncate w-full">{video?.title || id}</p>
                                            <button
                                                onClick={() => setCustomThumbnail(id, '')}
                                                className="px-2 py-1 bg-red-600 text-white text-[10px] rounded hover:bg-red-700"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Maintenance Tools */}
                <section className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
                        <span>🛠️</span>
                        <span>Maintenance & Repair</span>
                    </h2>
                    <p className="text-sm text-red-700/70 dark:text-red-400/70 mb-6 font-medium">
                        Use these tools to fix data inconsistencies or reset your local environment if you encounter errors.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900/30">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Clear Local Cache & Reset</h3>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                This will clear all settings, hide lists, and local video cache. Fixes persistent 404s on existing videos.
                            </p>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure? This will reset all local settings and clear your local video cache. Global videos in Supabase will NOT be deleted.')) {
                                        localStorage.clear();
                                        await videoDb.clearAll();
                                        window.location.reload();
                                    }
                                }}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                Reset Local Data
                            </button>
                        </div>

                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900/30">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">DANGER: Delete All Global Videos</h3>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                This will permanently delete ALL video overviews from the Supabase database. This cannot be undone!
                            </p>
                            <button
                                onClick={async () => {
                                    if (confirm('CRITICAL: Are you absolutely sure? This will delete EVERY video overview in Supabase AND your local cache. This is permanent!')) {
                                        setSyncing(true);
                                        try {
                                            // 1. Delete from Supabase
                                            const { error } = await supabase.from('videos').delete().neq('id', '0');
                                            if (error) throw error;

                                            // 2. Clear Local Cache (Crucial to avoid seeing deleted videos)
                                            await videoDb.clearAll();

                                            alert('All global and local video overviews have been deleted.');
                                            window.location.reload();
                                        } catch (err: any) {
                                            alert(`Delete failed: ${err.message}`);
                                        }
                                        setSyncing(false);
                                    }
                                }}
                                disabled={syncing}
                                className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:bg-gray-400"
                            >
                                {syncing ? 'Deleting...' : 'Delete All Global Videos'}
                            </button>
                        </div>

                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Cleanup Versioned Videos</h3>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Removes older versions of videos if a newer version exists (e.g., deletes "Title" if "Title (1)" exists).
                            </p>
                            <button
                                onClick={async () => {
                                    setSyncing(true);
                                    try {
                                        const allVids = [...videos];
                                        const toDeleteIds: string[] = [];

                                        allVids.forEach(v => {
                                            const versionedTitle = `${v.title} (1)`;
                                            const hasNewer = allVids.find(cand => cand.title === versionedTitle);
                                            if (hasNewer) {
                                                console.log(`Found newer version: ${versionedTitle} for ${v.title}`);
                                                toDeleteIds.push(v.id);
                                            }
                                        });

                                        if (toDeleteIds.length === 0) {
                                            alert('No old versions found to cleanup.');
                                        } else {
                                            if (confirm(`Found ${toDeleteIds.length} old versions to remove. Proceed?`)) {
                                                // Delete from Supabase
                                                const { error: globalErr } = await supabase.from('videos').delete().in('id', toDeleteIds);
                                                // Delete from Local
                                                for (const id of toDeleteIds) {
                                                    await videoDb.deleteVideo(id);
                                                }
                                                alert(`Successfully removed ${toDeleteIds.length} old video versions.`);
                                                window.location.reload();
                                            }
                                        }
                                    } catch (err: any) {
                                        alert(`Cleanup failed: ${err.message}`);
                                    }
                                    setSyncing(false);
                                }}
                                disabled={syncing}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:bg-gray-400"
                            >
                                {syncing ? 'Cleaning...' : 'Remove Old Versions'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
