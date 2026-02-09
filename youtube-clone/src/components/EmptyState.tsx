import Link from 'next/link';

interface EmptyStateProps {
    title?: string;
    message?: string;
    showSearch?: boolean;
    showHomeLink?: boolean;
}

export default function EmptyState({
    title = "Nothing here",
    message = "We couldn't find what you're looking for.",
    showSearch = true,
    showHomeLink = true
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-6xl mb-4">🔍</div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                {showHomeLink && (
                    <Link
                        href="/"
                        className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <span>🏠</span>
                        <span>Go Home</span>
                    </Link>
                )}

                {showSearch && (
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <span>🔎</span>
                        <span>Browse All</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
