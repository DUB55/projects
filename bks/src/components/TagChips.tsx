'use client';

import { useRouter } from 'next/navigation';

interface TagChipsProps {
    tags: string[];
    selectedTag?: string;
    baseUrl?: string;
}

export default function TagChips({ tags, selectedTag, baseUrl = '/' }: TagChipsProps) {
    const router = useRouter();

    const handleTagClick = (tag: string) => {
        const url = selectedTag === tag
            ? baseUrl
            : `${baseUrl}?search=${encodeURIComponent(tag)}`;
        router.push(url);
    };

    return (
        <div className="flex flex-wrap gap-2 py-4">
            <button
                onClick={() => router.push(baseUrl)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!selectedTag
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
            >
                All
            </button>
            {tags.map((tag) => (
                <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedTag === tag
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    {tag}
                </button>
            ))}
        </div>
    );
}
