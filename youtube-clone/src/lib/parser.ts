import { Video, Summary, Chapter, Link } from '@/types/video';

/**
 * Splits a large text block into individual video sections and parses them.
 */
export function parseVideoBatch(text: string): Partial<Video>[] {
    // Split by lookahead for "Video \d+:" or "Title:" at start of line
    // We add a newline to the start to ensure the first line is matched if it's the pattern
    const validText = '\n' + text;
    const chunks = validText.split(/\n(?=Video \d+:|Title:)/i).map(c => c.trim()).filter(c => c);

    const results: Partial<Video>[] = [];

    for (const chunk of chunks) {
        // Basic validation: must have at least a Title or Video header
        if (chunk.match(/^(Video \d+:|Title:)/i)) {
            const parsed = parseVideoText(chunk);
            if (parsed) {
                results.push(parsed);
            }
        }
    }

    return results;
}

/**
 * Removes conversational AI "garbage" lines from the end of a line array.
 */
function cleanLines(lines: string[]): string[] {
    const garbagePatterns = [
        /^✅\s*Chunk/i,
        /^Ready\s+for/i,
        /^You\s+have\s+now\s+received/i,
        /^Would\s+you\s+like/i,
        /^Let\s+me\s+know/i,
        /^Understood\./i,
        /^Continuing\s+with/i,
        /^A\s+compiled\s+master\s+document/i,
        /^A\s+custom\s+weekly\s+action\s+plan/i,
        /^To\s+continue\s+with/i,
        /^Continue/i,
        /^Sure,/i,
        /^Here\s+is/i
    ];

    // Remove empty lines or garbage from the END
    let endIndex = lines.length;
    while (endIndex > 0) {
        const line = lines[endIndex - 1].trim();
        if (!line) {
            endIndex--;
            continue;
        }

        const isGarbage = garbagePatterns.some(p => p.test(line));
        if (isGarbage) {
            endIndex--;
        } else {
            // Found a valid line (presumably), stop stripping
            break;
        }
    }

    // Also remove garbage from the START (e.g. "Understood. Here is...")
    // But be careful not to strip Title line if it was parsed separately, 
    // though parseVideoText usually expects Title to be line 0.
    // The "parseVideoBatch" splits by "Video N:", so line 0 should be "Video N...".
    // If there is garbage *before* "Video N", parseVideoBatch might have split it weirdly 
    // OR it wasn't split because the garbage didn't trigger the split.
    // However, parseVideoText EXPECTS line 0 to be title. 
    // If line 0 matches garbage, we might strip it, but then we lose position.
    // Actually, parseVideoBatch split uses lookahead for "Video \d:" or "Title:".
    // So the chunks passed here MUST start with that. 
    // Thus, leading garbage is unlikely inside the chunk unless it's strictly "Title:" format 
    // and there's stuff between Title and content? No.
    // Leading garbage is mostly handled by parseVideoBatch's regex split.
    // We strictly focus on TRAILING garbage here.

    return lines.slice(0, endIndex);
}

/**
 * Parses a raw text block into a partial Video object.
 * Expects format similar to:
 * 
 * "Video 69: Title
 * URL: ...
 * One-liner: ...
 * Summary: ...
 * Key Takeaways: ...
 * "
 */
export function parseVideoText(text: string): Partial<Video> | null {
    try {
        let rawLines = text.split('\n').map(l => l.trim());
        const lines = cleanLines(rawLines).filter(l => l); // Remove empty strings after cleaning

        if (lines.length === 0) return null;

        // Helper to find content between headers
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

            // Remove the header line itself if it's just the header, or extract part after colon
            const headerLine = lines[startIndex];
            let content = lines.slice(startIndex + 1, endIndex).join('\n');

            // If content is on the same line (e.g. "URL: https://...")
            if (headerLine.includes(':') && headerLine.split(':')[1].trim()) {
                const sameLineContent = headerLine.split(':').slice(1).join(':').trim();
                content = sameLineContent + (content ? '\n' + content : '');
            }

            return content.trim();
        };

        // Helper to parse list items
        const parseList = (text: string): string[] => {
            return text.split('\n')
                .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
                .filter(l => l);
        };

        // 1. Parse Title and Video Number
        // Expected: "Video 69: Why You Can’t Stay Consistent..." or just "Title..."
        const titleLine = lines[0];
        let videoNumber: number | undefined;
        let title = titleLine.replace(/^"|"$/g, ''); // Remove wrapping quotes if present

        const videoNumMatch = title.match(/^Video\s+(\d+):\s*(.*)/i);
        if (videoNumMatch) {
            videoNumber = parseInt(videoNumMatch[1]);
            title = videoNumMatch[2] || `Video ${videoNumber}`;
        } else if (title.toLowerCase().startsWith('title:')) {
            title = title.substring(6).trim();
        }

        // 2. Parse URL
        const urlText = findSection('URL', ['One-liner', 'Summary']);
        const sourceUrl = urlText || '';

        // 3. Parse One Liner
        const oneLiner = findSection('One-liner', ['Summary', 'Key Takeaways']);

        // 4. Parse Summary
        const overview = findSection('Summary', ['Key Takeaways', 'Chapters', 'Topics', 'Resources', 'How to Apply']);

        // 5. Parse Key Takeaways
        const takeawaysText = findSection('Key Takeaways', ['Chapters', 'Topics', 'Resources', 'How to Apply']);
        // Filter out "Actionable:", "Conceptual:" labels if needed, or keep them as is. 
        // The example has them as lines. Let's treat lines as items.
        const keyTakeaways = parseList(takeawaysText);

        // 6. Parse Chapters
        const chaptersText = findSection('Chapters', ['Topics', 'Resources', 'How to Apply']); // Changed 'Chapters/Timestamps' to match generic 'Chapters'
        // Fallback for variation
        const altChaptersText = chaptersText || findSection('Timestamps', ['Topics', 'Resources', 'How to Apply']);

        const chapters: Chapter[] = [];
        // Basic timestamp parsing if present (e.g. "00:00 Intro")
        (altChaptersText || '').split('\n').forEach(line => {
            const match = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s+[-–—]?\s*(.*)/);
            if (match) {
                chapters.push({ timecode: match[1], title: match[2] });
            } else if (line.trim()) {
                // preserve non-timestamp lines as "notes" or generic chapters? 
                // Or just optional chapters.
            }
        });

        // 7. Parse Topics/Entities
        const entitiesText = findSection('Topics', ['Resources', 'How to Apply']); // Simplified
        const entities = entitiesText.split(/,\s*/).map(s => s.trim()).filter(Boolean);

        // 8. Parse Resources
        const linksText = findSection('Resources', ['How to Apply', 'Short Bullet Summary']);
        const links: Link[] = linksText.split('\n').map(line => {
            // Simple heuristic: if line contains http, try to extract it
            const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
                return {
                    label: line.replace(urlMatch[0], '').trim() || 'Link',
                    url: urlMatch[0]
                };
            }
            return { label: line, url: '#' };
        }).filter(l => l.label || l.url !== '#');

        // 9. Parse How to Apply
        const applyText = findSection('How to Apply', ['Short Bullet Summary', 'Concise Complete Summary']);
        const howToApply = parseList(applyText);

        // 10. Short Bullet Summary
        const bulletSumText = findSection('Short Bullet Summary', ['Concise Complete Summary']);
        const shortBulletSummary = parseList(bulletSumText);

        // 11. Concise Complete Summary
        const conciseCompleteSummary = findSection('Concise Complete Summary', []);

        // Construct Summary object
        const summary: Summary = {
            overview,
            keyTakeaways,
            chapters: chapters.length > 0 ? chapters : undefined,
            entities,
            links: links.length > 0 ? links : undefined,
            howToApply: howToApply.length > 0 ? howToApply : undefined,
            shortBulletSummary: shortBulletSummary.length > 0 ? shortBulletSummary : undefined,
            conciseCompleteSummary
        };

        // ID generation suitable for URL (slugify title)
        const id = 'vid_' + title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 50);

        return {
            id,
            title,
            videoNumber,
            sourceUrl,
            oneLiner,
            summary,
            tags: entities, // Use entities as tags default
            type: 'video',
            channel: 'Imported Channel', // Default
            channelId: 'imported',
            thumbnailUrl: getYouTubeId(sourceUrl) ? `https://img.youtube.com/vi/${getYouTubeId(sourceUrl)}/maxresdefault.jpg` : '/thumbs/default.jpg',
            createdAt: new Date().toISOString()
        };

    } catch (error) {
        console.error("Error parsing video text:", error);
        return null;
    }
}

function getYouTubeId(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
    return match ? match[1] : '';
}
