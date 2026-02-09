'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

function MagicLoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login } = useAdmin();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            const success = login(token);
            if (success) {
                // Success: Redirect to settings
                router.push('/admin/settings');
            } else {
                // Failed: Redirect home quietly
                router.push('/');
            }
        } else {
            // No token: Redirect home quietly
            router.push('/');
        }
    }, [token, login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Please wait...</p>
            </div>
        </div>
    );
}

export default function MagicLoginPage() {
    return (
        <Suspense fallback={null}>
            <MagicLoginContent />
        </Suspense>
    );
}
