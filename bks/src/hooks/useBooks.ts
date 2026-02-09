import { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { bookDb } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { MOCK_BOOKS } from '@/lib/static-books';

export function useBooks() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadBooks() {
            setLoading(true);
            try {
                // 1. Fetch from Supabase (only if configured and initialized)
                let globalBooks: Book[] = [];
                if (supabase) {
                    try {
                        const { data, error } = await supabase
                            .from('books')
                            .select('*')
                            .order('createdAt', { ascending: false });
                        
                        if (error) {
                            console.warn("Supabase fetch error:", error.message);
                        } else {
                            globalBooks = data || [];
                        }
                    } catch (err) {
                        console.error("Supabase request failed:", err);
                    }
                }

                // 2. Fetch from IndexedDB
                let localBooks: Book[] = [];
                try {
                    localBooks = await bookDb.getAllBooks();
                } catch (err) {
                    console.warn("IndexedDB fetch error:", err);
                }

                // Combine (Supabase > Local > Mock)
                const combined = [
                    ...(Array.isArray(MOCK_BOOKS) ? MOCK_BOOKS : []),
                    ...(Array.isArray(localBooks) ? localBooks : []),
                    ...(Array.isArray(globalBooks) ? globalBooks : [])
                ];
                const idMap = new Map();
                combined.forEach(b => {
                    if (b && b.id) {
                        idMap.set(b.id, b);
                    }
                });
                
                setBooks(Array.from(idMap.values()));
            } catch (e) {
                console.error("Error loading books:", e);
                setBooks(MOCK_BOOKS);
            } finally {
                setLoading(false);
            }
        }
        loadBooks();
    }, []);

    return { books, loading };
}
