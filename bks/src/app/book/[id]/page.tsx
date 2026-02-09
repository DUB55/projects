'use client';

import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book } from '@/types/book';
import { bookDb } from '@/lib/db';
import { MOCK_BOOKS, getRelatedBooks } from '@/lib/static-books';
import SummaryPanel from '@/components/SummaryPanel';
import RelatedBooks from '@/components/RelatedBooks';
import { generateInitials, stringToColor } from '@/lib/utils';
import { ChevronLeft, Share2, Bookmark, ExternalLink, Loader2 } from 'lucide-react';

export default function BookDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBook = async () => {
            if (!id) return;
            
            try {
                // 1. Try IndexedDB
                let foundBook = await bookDb.getBookById(id);
                
                // 2. Try Mock Data if not found
                if (!foundBook) {
                    foundBook = MOCK_BOOKS.find(b => b.id === id) || null;
                }
                
                setBook(foundBook);
            } catch (err) {
                console.error("Error fetching book:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading summary...</p>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Book Not Found</h1>
                <p className="text-gray-500 mb-8">The book you are looking for doesn't exist.</p>
                <Link 
                    href="/" 
                    className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-lg"
                >
                    Back to Library
                </Link>
            </div>
        );
    }

    const related = getRelatedBooks(book, 6);
    const authorColor = stringToColor(book.author);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Book Header Card */}
                    <div className="bg-gradient-to-br from-teal-500/10 to-purple-500/10 dark:from-teal-500/20 dark:to-purple-500/20 rounded-3xl p-6 sm:p-8 border border-white/20 dark:border-gray-800/20 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Cover Image */}
                            <div className="flex-shrink-0 w-full md:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl bg-zinc-200 dark:bg-zinc-800 border border-white/20 dark:border-gray-800/50">
                                <img 
                                    src={book.coverUrl} 
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        const fallback = 'https://via.placeholder.com/400x600?text=' + encodeURIComponent(book.title);
                                        if (target.src !== fallback) {
                                            target.src = fallback;
                                        }
                                    }}
                                />
                            </div>

                            {/* Book Metadata */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-teal-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                                        <span>📖</span> {book.genre}
                                    </span>
                                    <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full backdrop-blur-sm">
                                        Published {book.publishedYear}
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                                    {book.title}
                                </h1>

                                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner"
                                            style={{ backgroundColor: authorColor }}
                                        >
                                            {generateInitials(book.author)}
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-900 dark:text-white">
                                                {book.author}
                                            </span>
                                            <span className="text-xs text-gray-500">Official Author</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                                            <Share2 size={20} />
                                        </button>
                                        <button className="p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                                            <Bookmark size={20} />
                                        </button>
                                        <button className="px-6 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm flex items-center gap-2">
                                            <span>🛒</span> Buy Book
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {book.tags.map((tag) => (
                                <Link
                                    key={tag}
                                    href={`/?search=${encodeURIComponent(tag)}`}
                                    className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-sm transition-colors border border-gray-200/20"
                                >
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <SummaryPanel book={book} />
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Related Summaries</h3>
                            <RelatedBooks books={related} />
                        </div>
                        
                        {/* Action Card */}
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-500/20">
                            <h3 className="font-bold text-lg mb-2">Want the full book?</h3>
                            <p className="text-teal-50 text-sm mb-4">Get the complete insights and wisdom directly from the source.</p>
                            <button className="w-full py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
                                <ExternalLink size={18} />
                                View on Amazon
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
