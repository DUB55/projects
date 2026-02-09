'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useBooks } from '@/hooks/useBooks';
import BookCard from '@/components/BookCard';
import Navbar from '@/components/Navbar';
import TagChips from '@/components/TagChips';
import { getAllTags } from '@/lib/static-books';
import Fuse from 'fuse.js';

const LIMIT = 12;

export default function HomePage() {
    const { books, loading } = useBooks();
    const [searchQuery, setSearchQuery] = useState('');
    const [displayBooks, setDisplayBooks] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const observerTarget = useRef<HTMLDivElement>(null);
    const [allTags, setAllTags] = useState<string[]>([]);

    // Initialize search query from URL and fetch tags
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search');
        if (search) setSearchQuery(search);
        
        setAllTags(getAllTags());
    }, []);

    // Sync state with URL changes
    useEffect(() => {
        const handleLocationChange = () => {
            const params = new URLSearchParams(window.location.search);
            const search = params.get('search');
            setSearchQuery(search || '');
        };

        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);

    // Fuse.js search
    const fuse = useMemo(() => {
        if (!Array.isArray(books)) return null;
        return new Fuse(books, {
            keys: ['title', 'author', 'tags', 'oneLiner', 'genre'],
            threshold: 0.3,
            distance: 100
        });
    }, [books]);

    const filteredBooks = useMemo(() => {
        if (!searchQuery) return books || [];
        if (!fuse) return books || [];
        return fuse.search(searchQuery).map(result => result.item);
    }, [books, searchQuery, fuse]);

    // Reset pagination when filteredBooks changes
    useEffect(() => {
        setPage(1);
        setDisplayBooks(filteredBooks.slice(0, LIMIT));
    }, [filteredBooks]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && displayBooks.length < filteredBooks.length) {
                    loadMore();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [displayBooks.length, filteredBooks.length, loading]);

    const loadMore = () => {
        const nextPage = page + 1;
        const nextBooks = filteredBooks.slice(0, nextPage * LIMIT);
        setDisplayBooks(nextBooks);
        setPage(nextPage);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] transition-colors duration-300">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <section className="pt-12 pb-8 text-center">
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
                        📚 Book <span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">Summaries</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Deep-dive summaries for the world's best books. 
                        Master any topic with AI-powered insights.
                    </p>
                </section>

                {/* Tags Filter */}
                <div className="sticky top-[64px] z-40 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 mb-8">
                    <TagChips 
                        tags={allTags} 
                        selectedTag={searchQuery} 
                        baseUrl="/"
                    />
                </div>

                {/* Library Section */}
                <section className="pb-20">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>📖</span>
                            <span>{searchQuery ? `Results for "${searchQuery}"` : 'Latest Summaries'}</span>
                        </h2>
                        <span className="px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {filteredBooks.length} books found
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={`skeleton-${i}`} className="space-y-4 animate-pulse">
                                    <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {displayBooks.map((book, index) => (
                                    <div
                                        key={book.id}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <BookCard book={book} />
                                    </div>
                                ))}
                            </div>

                            {displayBooks.length === 0 && (
                                <div className="text-center py-24 bg-gray-50 dark:bg-gray-900/30 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                    <div className="max-w-xs mx-auto">
                                        <span className="text-5xl mb-4 block">🔍</span>
                                        <h3 className="text-xl font-bold mb-2 dark:text-white">No results found</h3>
                                        <p className="text-gray-500">We couldn't find any books matching your search. Try another topic!</p>
                                        {searchQuery && (
                                            <button 
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    const url = new URL(window.location.href);
                                                    url.searchParams.delete('search');
                                                    window.history.pushState({}, '', url.toString());
                                                }}
                                                className="mt-6 text-teal-600 font-bold hover:underline"
                                            >
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Infinite Scroll Trigger */}
                            <div ref={observerTarget} className="py-16 flex justify-center">
                                {displayBooks.length < filteredBooks.length && (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                                        <p className="text-sm text-gray-500 font-medium tracking-wide">Loading more wisdom...</p>
                                    </div>
                                )}
                                {displayBooks.length >= filteredBooks.length && filteredBooks.length > 0 && (
                                    <div className="text-center">
                                        <div className="h-px w-24 bg-gray-200 dark:bg-gray-800 mx-auto mb-4" />
                                        <p className="text-gray-400 text-sm italic">You've reached the end of the library.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
