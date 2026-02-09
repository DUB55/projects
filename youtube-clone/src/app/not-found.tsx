import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="text-8xl mb-6">🎬</div>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                404 - Not Found
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Oops! This summary doesn&apos;t exist or might have been removed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    href="/"
                    className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <span>🏠</span>
                    <span>Go Home</span>
                </Link>

                <Link
                    href="/collections"
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <span>📚</span>
                    <span>Browse Collections</span>
                </Link>
            </div>
        </div>
    );
}
