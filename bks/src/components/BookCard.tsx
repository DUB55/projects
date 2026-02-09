'use client';

import Link from 'next/link';
import { Book } from '@/types/book';
import { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

interface BookCardProps {
    book: Book;
}

export default function BookCard({ book }: BookCardProps) {
    const [imageError, setImageError] = useState(false);
    const { isAdmin } = useAdmin();

    const displayCoverUrl = imageError 
        ? `https://via.placeholder.com/400x600?text=${encodeURIComponent(book.title)}`
        : book.coverUrl;

    return (
        <div className="relative group block">
            {/* Admin Controls Overlay */}
            {isAdmin && (
                <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="p-1.5 bg-teal-600/90 backdrop-blur-sm text-white rounded text-[10px] font-bold hover:bg-teal-700 shadow-sm flex items-center gap-1"
                        title="Edit Book"
                    >
                        <span>📝</span>
                        <span>Edit</span>
                    </button>
                </div>
            )}

            <Link
                href={`/book/${book.id}`}
                className="block rounded-xl overflow-hidden bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 shadow-sm hover:shadow-xl dark:hover:shadow-teal-900/20 transition-all duration-300 hover:-translate-y-1 group"
            >
                {/* Cover Image - Portrait for Books */}
                <div className="relative aspect-[2/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img
                        src={displayCoverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImageError(true)}
                    />

                    {/* Genre Badge */}
                    {book.genre && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium rounded border border-white/10">
                            {book.genre}
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">
                        <span className="opacity-80">{book.author}</span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {book.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800/50">
                        {Array.isArray(book.tags) && book.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-[10px] bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-100 dark:border-gray-700 font-medium"
                            >
                                #{tag}
                            </span>
                        ))}
                        {Array.isArray(book.tags) && book.tags.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                +{book.tags.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
