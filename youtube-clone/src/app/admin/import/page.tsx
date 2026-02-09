'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter, notFound } from 'next/navigation';
import { Video } from '@/types/video';
import { parseVideoBatch } from '@/lib/parser';
import { useAdmin } from '@/context/AdminContext';
import { videoDb } from '@/lib/db';
import { supabase } from '@/lib/supabase';

function AdminImportContent() {
    const searchParams = useSearchParams();
    const secretKey = searchParams.get('key');
    const { isAdmin, login } = useAdmin();
    const router = useRouter();

    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [rawText, setRawText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Conflict resolution state
    const [conflicts, setConflicts] = useState<Video[]>([]);
    const [pendingImport, setPendingImport] = useState<Video[]>([]);

    // Check auth immediately
    useEffect(() => {
        // If query param key is present, try to login
        if (secretKey) {
            const success = login(secretKey);
            if (success) {
                // If login successful, remove key from URL for cleanliness (optional but good)
                router.replace('/admin/import');
            }
        }
    }, [secretKey, login, router]);

    // Derived authorization state: either already admin or key matched
    const isAuthorized = isAdmin || secretKey === 'admin123';

    // STEALTH MODE: If not authorized, show NOTHING (will trigger not-found effect or return null)
    // We use a separate useEffect to trigger notFound() to avoid hydration mismatches if possible,
    // or arguably just return null and let a client-side effect redirect to 404.
    // However, Next.js notFound() is server-side friendly but in client component it works similarly.

    // Simplest stealth: If not authorized, return null and redirect/show 404 equivalent.

    if (!isAuthorized) {
        // We can't strictly call notFound() from top level render in all Next versions safely without async,
        // but typically we can return null and redirect.
        // For stealth, let's return null and let the useEffect redirect if needed, OR just render NotFound.
        // Actually, the user wants "this page should never be shown".
        // Let's use the notFound helper from next/navigation if compatible, or just return null.
        return null;
    }

    // Effect to handle the redirect if still not authorized after mount
    // Note: We can't conditional hook, so we moved hooks up.
    // Let's restructure.

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        if (!file.name.endsWith('.json')) {
            setResult({ success: false, message: 'Please upload a JSON file.' });
            return;
        }
        setImporting(true);
        setResult(null);
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!Array.isArray(data)) throw new Error('JSON must be an array of videos');
            identifyConflicts(data as Partial<Video>[]);
        } catch (error) {
            setResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to parse JSON file'
            });
            setImporting(false);
        }
    };

    const handleTextImport = () => {
        if (!rawText.trim()) return;
        setImporting(true);
        setResult(null);
        try {
            // Attempt to parse standard formatted text
            const parsedVideos = parseVideoBatch(rawText);
            if (parsedVideos.length > 0) {
                identifyConflicts(parsedVideos);
            } else {
                throw new Error('Failed to parse text. Ensure it matches the required format.');
            }
        } catch (error) {
            setResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to parse text'
            });
            setImporting(false);
        }
    };

    const identifyConflicts = async (incoming: Partial<Video>[]) => {
        const existing = await videoDb.getAllVideos();
        const existingMap = new Map(existing.map(v => [v.id, v]));

        const newConflicts: Video[] = [];
        const readyToImport: Video[] = [];

        incoming.forEach((item, index) => {
            const video = {
                id: item.id || `vid_${Date.now()}_${index}`,
                title: item.title || 'Untitled',
                type: item.type || 'video',
                tags: item.tags || [],
                thumbnailUrl: item.thumbnailUrl || '/thumbs/default.jpg',
                sourceUrl: item.sourceUrl || '#',
                summary: item.summary || { overview: 'No summary provided', keyTakeaways: [] },
                createdAt: item.createdAt || new Date().toISOString(),
                ...item
            } as Video;

            // Check for exact ID match or 100% identical title/number/overview
            const match = existing.find(e =>
                e.id === video.id ||
                (e.title === video.title && e.summary.overview === video.summary.overview)
            );

            if (match) {
                newConflicts.push(video);
            } else {
                readyToImport.push(video);
            }
        });

        if (newConflicts.length > 0) {
            setConflicts(newConflicts);
            setPendingImport(readyToImport);
            setImporting(false);
        } else {
            finalizeImport(readyToImport);
        }
    };

    const finalizeImport = async (videos: Video[]) => {
        setImporting(true);
        try {
            // 1. Save to Local IndexedDB (Cache)
            await videoDb.saveVideos(videos);

            // 2. Sync to Global Supabase
            const dbVideos = videos.map(v => ({
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

            const { error: supabaseError } = await supabase
                .from('videos')
                .upsert(dbVideos);

            if (supabaseError) {
                console.error('Supabase sync error:', supabaseError);
                setResult({
                    success: true,
                    message: `Imported ${videos.length} videos locally, but Supabase sync failed. (Check .env.local)`
                });
            } else {
                setResult({
                    success: true,
                    message: `Successfully imported ${videos.length} videos globally!`
                });
            }

            setRawText('');
            setConflicts([]);
            setPendingImport([]);
        } catch (error) {
            console.error('Import error:', error);
            setResult({
                success: false,
                message: 'Error occurred during import.'
            });
        }
        setImporting(false);
    };

    const resolveConflicts = async (action: 'skip' | 'overwrite' | 'copy') => {
        const resolved: Video[] = [...pendingImport];

        for (const c of conflicts) {
            if (action === 'skip') continue;

            if (action === 'overwrite') {
                resolved.push(c);
            } else if (action === 'copy') {
                resolved.push({
                    ...c,
                    id: c.id + '_copy_' + Date.now(),
                    title: `${c.title} (1)`
                });
            }
        }

        await finalizeImport(resolved);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span>📥</span>
                <span>Import Data</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Import videos via JSON file or plain text.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
                {/* JSON File Import */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">JSON File Upload</h2>
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors h-64 flex flex-col items-center justify-center ${dragActive
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                            : 'border-gray-300 dark:border-gray-700 hover:border-teal-400'
                            }`}
                    >
                        <div className="text-4xl mb-4">📂</div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">Drag JSON file here</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">or</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white rounded-lg font-medium transition-colors"
                        >
                            Choose File
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Text Parsing Import */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Text Import</h2>
                    <div className="h-64 flex flex-col">
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={`Paste video text here...\n"Video 69: Title\nURL: ...\nSummary: ..."`}
                            className="flex-1 w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none font-mono text-sm"
                        />
                        <button
                            onClick={handleTextImport}
                            disabled={importing || !rawText.trim()}
                            className="mt-4 px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors w-full"
                        >
                            Parse & Import
                        </button>
                    </div>
                </div>
            </div>

            {/* Conflict Resolution UI */}
            {conflicts.length > 0 && (
                <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{conflicts.length} Duplicate Videos Detected</span>
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 mb-6 text-sm">
                        These videos already exist in your database (matching Title or Overview). How would you like to handle them?
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => resolveConflicts('skip')}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
                        >
                            Skip All
                        </button>
                        <button
                            onClick={() => resolveConflicts('overwrite')}
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                        >
                            Overwrite Existing
                        </button>
                        <button
                            onClick={() => resolveConflicts('copy')}
                            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                        >
                            Import as Copies (1)
                        </button>
                    </div>

                    <div className="mt-6 max-h-48 overflow-y-auto">
                        <ul className="space-y-2">
                            {conflicts.map((c, i) => (
                                <li key={i} className="text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-1">
                                    {c.videoNumber ? `[${c.videoNumber}] ` : ''}{c.title}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Result Message */}
            {result && (
                <div className={`mt-8 p-4 rounded-xl ${result.success
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span>{result.success ? '✅' : '❌'}</span>
                        <span>{result.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminImportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <AdminImportContent />
        </Suspense>
    );
}
