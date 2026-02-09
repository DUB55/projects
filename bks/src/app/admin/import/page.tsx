'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { parseBookBatch } from '@/lib/parser';
import { bookDb } from '@/lib/db';
import { Book } from '@/types/book';
import { ChevronLeft, Check, AlertCircle, Save, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminImportPage() {
    const { isAdmin, isLoaded, login } = useAdmin();
    const [input, setInput] = useState('');
    const [parsedBooks, setParsedBooks] = useState<Partial<Book>[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [loginKey, setLoginKey] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !isAdmin) {
            // Stay on page but show login
        }
    }, [isLoaded, isAdmin]);

    const handleParse = () => {
        const books = parseBookBatch(input);
        setParsedBooks(books);
        if (books.length === 0) {
            setStatus({ type: 'error', message: 'No valid books found in the text.' });
        } else {
            setStatus({ type: 'success', message: `Found ${books.length} books!` });
        }
    };

    const handleSave = async () => {
        if (parsedBooks.length === 0) return;
        setIsSaving(true);
        setStatus(null);

        try {
            // Fill in missing fields for Book type
            const booksToSave: Book[] = parsedBooks.map(b => ({
                id: b.id || Math.random().toString(36).substring(7),
                title: b.title || 'Untitled',
                author: b.author || 'Unknown Author',
                genre: b.genre || 'Uncategorized',
                publishedYear: b.publishedYear || new Date().getFullYear(),
                oneLiner: b.oneLiner || '',
                tags: b.tags || [],
                coverUrl: b.coverUrl || '/covers/default.jpg',
                createdAt: b.createdAt || new Date().toISOString(),
                summary: b.summary || {
                    overview: '',
                    keyTakeaways: [],
                    detailedSummary: '',
                    howToApply: [],
                    themes: [],
                    shortBulletSummary: []
                }
            }));

            await bookDb.saveBooks(booksToSave);
            setStatus({ type: 'success', message: `Successfully saved ${booksToSave.length} books to local library!` });
            setParsedBooks([]);
            setInput('');
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Failed to save books. Check console for details.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(loginKey)) {
            setLoginKey('');
        } else {
            alert('Invalid admin key');
        }
    };

    if (!isLoaded) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <BookOpen size={32} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">Admin Access</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8">Enter your secret key to access the importer</p>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input 
                            type="password"
                            placeholder="Secret Admin Key"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={loginKey}
                            onChange={(e) => setLoginKey(e.target.value)}
                            autoFocus
                        />
                        <button 
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Login
                        </button>
                    </form>
                    <Link href="/" className="block text-center mt-6 text-sm text-zinc-500 hover:text-blue-500 transition-colors">
                        Return to Library
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
            <div className="max-w-6xl mx-auto p-6 md:p-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Admin Importer</h1>
                            <p className="text-zinc-500 dark:text-zinc-400">Import bulk AI-generated book summaries</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleParse}
                            className="px-6 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-bold rounded-xl transition-all"
                        >
                            Parse Text
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={parsedBooks.length === 0 || isSaving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save to Library
                        </button>
                    </div>
                </header>

                {status && (
                    <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${
                        status.type === 'success' 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                        {status.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        <p className="font-medium">{status.message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">AI Response Text</h2>
                            <span className="text-xs text-zinc-500">Paste the AI output here</span>
                        </div>
                        <textarea 
                            className="w-full h-[600px] p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm resize-none shadow-inner"
                            placeholder="Book: Atomic Habits&#10;Author: James Clear&#10;Genre: Self-help&#10;Year: 2018&#10;One-liner: A proven framework for improving every day.&#10;... (rest of fields)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Preview ({parsedBooks.length})</h2>
                            <span className="text-xs text-zinc-500">How it will look in the app</span>
                        </div>
                        <div className="h-[600px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {parsedBooks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                    <BookOpen size={48} className="mb-4 opacity-20" />
                                    <p>Parse text to see preview</p>
                                </div>
                            ) : (
                                parsedBooks.map((book, idx) => (
                                    <div key={book.id || `preview-${idx}`} className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-black text-lg leading-tight">{book.title}</h3>
                                                <p className="text-blue-500 font-bold text-sm">{book.author}</p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                                {book.genre}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 italic mb-4">"{book.oneLiner}"</p>
                                        <div className="space-y-2">
                                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-full"></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
                                                <span>Summary Ready</span>
                                                <span>{book.summary?.keyTakeaways?.length || 0} Takeaways</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
