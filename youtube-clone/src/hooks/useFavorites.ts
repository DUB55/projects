'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'stream-summarize-favorites';

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch {
                setFavorites([]);
            }
        }
    }, []);

    const saveFavorites = useCallback((newFavorites: string[]) => {
        setFavorites(newFavorites);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    }, []);

    const addFavorite = useCallback((videoId: string) => {
        const newFavorites = [...favorites, videoId];
        saveFavorites(newFavorites);
    }, [favorites, saveFavorites]);

    const removeFavorite = useCallback((videoId: string) => {
        const newFavorites = favorites.filter(id => id !== videoId);
        saveFavorites(newFavorites);
    }, [favorites, saveFavorites]);

    const toggleFavorite = useCallback((videoId: string) => {
        if (favorites.includes(videoId)) {
            removeFavorite(videoId);
        } else {
            addFavorite(videoId);
        }
    }, [favorites, addFavorite, removeFavorite]);

    const isFavorite = useCallback((videoId: string) => {
        return favorites.includes(videoId);
    }, [favorites]);

    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        mounted
    };
}
