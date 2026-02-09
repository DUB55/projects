'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminSettings {
    showMockData: boolean;
}

interface AdminContextType {
    isAdmin: boolean;
    settings: AdminSettings;
    login: (key: string) => boolean;
    logout: () => void;
    isLoaded: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [settings] = useState<AdminSettings>({ showMockData: true });

    useEffect(() => {
        try {
            const auth = localStorage.getItem('bks_admin_auth');
            if (auth === 'true') setIsAdmin(true);
        } catch (e) {
            console.warn("Failed to access localStorage for admin auth:", e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const login = (key: string) => {
        if (key === 'admin123') {
            setIsAdmin(true);
            localStorage.setItem('bks_admin_auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        localStorage.removeItem('bks_admin_auth');
    };

    return (
        <AdminContext.Provider value={{ isAdmin, settings, login, logout, isLoaded }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (!context) throw new Error('useAdmin must be used within AdminProvider');
    return context;
}
