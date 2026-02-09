import { Book } from '@/types/book';

/**
 * Splits AI response into individual book objects
 */
export function parseBookBatch(text: string): Partial<Book>[] {
    const validText = '\n' + text;
    const chunks = validText.split(/\n(?=Book:)/i).map(c => c.trim()).filter(c => c);
    
    return chunks.map(chunk => parseBookText(chunk)).filter((b): b is Partial<Book> => b !== null);
}

export function parseBookText(text: string): Partial<Book> | null {
    try {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        
        const findSection = (header: string, nextHeaders: string[]): string => {
            const startIndex = lines.findIndex(l => l.toLowerCase().startsWith(header.toLowerCase()));
            if (startIndex === -1) return '';

            let endIndex = lines.length;
            for (let i = startIndex + 1; i < lines.length; i++) {
                if (nextHeaders.some(h => lines[i].toLowerCase().startsWith(h.toLowerCase()))) {
                    endIndex = i;
                    break;
                }
            }

            const headerLine = lines[startIndex];
            let content = lines.slice(startIndex + 1, endIndex).join('\n');
            
            if (headerLine.includes(':')) {
                const sameLine = headerLine.split(':').slice(1).join(':').trim();
                content = sameLine + (content ? '\n' + content : '');
            }
            return content.trim();
        };

        const parseList = (text: string): string[] => {
            return text.split('\n')
                .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
                .filter(l => l);
        };

        const title = findSection('Book', ['Author', 'Genre']);
        const author = findSection('Author', ['Genre', 'Year']);
        const genre = findSection('Genre', ['Year', 'One-liner']);
        const yearStr = findSection('Year', ['One-liner', 'Overview']);
        const year = Number.parseInt(yearStr) || new Date().getFullYear();
        const oneLiner = findSection('One-liner', ['Overview', 'Key Takeaways']);
        const overview = findSection('Overview', ['Key Takeaways', 'Detailed Summary']);
        const keyTakeaways = parseList(findSection('Key Takeaways', ['Detailed Summary', 'How to Apply']));
        const detailedSummary = findSection('Detailed Summary', ['How to Apply', 'Themes']);
        const howToApply = parseList(findSection('How to Apply', ['Themes', 'Short Bullet Summary']));
        const themes = findSection('Themes', ['Short Bullet Summary', 'Chapters'])
            .split(/,\s*/)
            .map(s => s.trim())
            .filter(Boolean);
        const shortBulletSummary = parseList(findSection('Short Bullet Summary', ['Chapters']));
        
        const chaptersText = findSection('Chapters', []);
        const chapters = chaptersText.split('\n').map(line => {
            const match = line.match(/^(\d+\.?|[-•*])?\s*(.*?):\s*(.*)/);
            if (match) return { title: match[2], summary: match[3] };
            return null;
        }).filter((c): c is { title: string; summary: string } => c !== null);

        const id = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return {
            id,
            title,
            author,
            genre,
            publishedYear: year,
            oneLiner,
            tags: themes,
            summary: {
                overview,
                keyTakeaways,
                detailedSummary,
                howToApply,
                themes,
                shortBulletSummary,
                chapters: chapters.length > 0 ? chapters : undefined
            },
            coverUrl: '/covers/default.jpg',
            createdAt: new Date().toISOString()
        };
    } catch (e) {
        console.error("Parse error:", e);
        return null;
    }
}
