'use client';

import Link from 'next/link';
import { Book } from '@/types/book';
import { useState } from 'react';

interface RelatedBooksProps {
    books: Book[];
    title?: string;
}

function RelatedBookCard({ book }: { book: Book }) {
    const [imageError, setImageError] = useState(false);

    return (
        <Link
            href={`/book/${book.id}`}
            className="flex gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
            {/* Mini Thumbnail */}
            <div className="flex-shrink-0 w-20 aspect-[2/3] bg-gradient-to-br from-teal-500/30 to-purple-500/30 rounded-lg overflow-hidden relative">
                {!imageError && (
                    <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                )}
                <span className="absolute top-1 left-1 px-1 py-0.5 bg-teal-500 text-white text-[10px] font-bold rounded">
                    📚
                </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {book.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {book.author}
                </p>
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-teal-600 dark:text-teal-400">📝 Summary</span>
                </div>
            </div>
        </Link>
    );
}

export default function RelatedBooks({ books, title = "Related Summaries" }: RelatedBooksProps) {
    if (books.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 px-2">
                <span>📖</span>
                <span>{title}</span>
            </h2>

            <div className="space-y-1">
                {books.map((book) => (
                    <RelatedBookCard key={book.id} book={book} />
                ))}
            </div>
        </div>
    );
}
