import { Book } from '@/types/book';

export const MOCK_BOOKS: Book[] = [
    {
        id: 'atomic-habits',
        title: 'Atomic Habits',
        author: 'James Clear',
        genre: 'Self-Help',
        coverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg',
        publishedYear: 2018,
        tags: ['habits', 'productivity', 'psychology'],
        oneLiner: 'Tiny Changes, Remarkable Results.',
        summary: {
            overview: 'Atomic Habits provides a proven framework for improving every day. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.\n\nIf you\'re having trouble changing your habits, the problem isn\'t you. The problem is your system. Bad habits repeat themselves again and again not because you don\'t want to change, but because you have the wrong system for change. You do not rise to the level of your goals. You fall to the level of your systems. Here, you\'ll get a proven system that can take you to new heights.',
            keyTakeaways: [
                'Habits are the compound interest of self-improvement.',
                'Focus on systems instead of goals.',
                'The Four Laws of Behavior Change: Make it Obvious, Attractive, Easy, and Satisfying.',
                'Environment is the invisible hand that shapes human behavior.',
                'You do not rise to the level of your goals. You fall to the level of your systems.'
            ],
            detailedSummary: 'James Clear explains how small changes can lead to life-altering results. He introduces the concept of "Atomic Habits," which are small, easy-to-do behaviors that, when repeated over time, compound into significant improvements. The book is structured around the Four Laws of Behavior Change, providing a comprehensive guide to building better habits and breaking bad ones.',
            howToApply: [
                'Design your environment for success.',
                'Use habit stacking to build new routines.',
                'Focus on identity-based habits rather than outcome-based ones.',
                'Track your habits to maintain momentum.'
            ],
            themes: ['Habits', 'Systems', 'Identity', 'Continuous Improvement'],
            shortBulletSummary: [
                'Small wins compound over time.',
                'Focus on systems, not just goals.',
                'Build identity-based habits.',
                'Optimize your environment.'
            ],
            chapters: [
                { title: 'The Fundamentals', summary: 'Why tiny changes make a big difference.' },
                { title: 'The 1st Law', summary: 'Make it obvious.' },
                { title: 'The 2nd Law', summary: 'Make it attractive.' },
                { title: 'The 3rd Law', summary: 'Make it easy.' },
                { title: 'The 4th Law', summary: 'Make it satisfying.' }
            ]
        },
        createdAt: new Date().toISOString()
    },
    {
        id: 'deep-work',
        title: 'Deep Work',
        author: 'Cal Newport',
        genre: 'Productivity',
        coverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1447957962i/25744928.jpg',
        publishedYear: 2016,
        tags: ['productivity', 'focus', 'work'],
        oneLiner: 'Rules for Focused Success in a Distracted World.',
        summary: {
            overview: 'Deep work is the ability to focus without distraction on a cognitively demanding task. It\'s a skill that allows you to quickly master complicated information and produce better results in less time.',
            keyTakeaways: [
                'Deep work is valuable, rare, and meaningful.',
                'Multitasking is a myth; attention residue kills productivity.',
                'Schedule your deep work sessions in advance.',
                'Embrace boredom to strengthen your focus.'
            ],
            detailedSummary: 'Cal Newport argues that the ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy. He provides four "rules" for transforming your mind and habits to support this skill.',
            howToApply: [
                'Quit social media or limit its use.',
                'Schedule every minute of your day.',
                'Create a deep work ritual.',
                'Drain the shallows by minimizing low-value tasks.'
            ],
            themes: ['Focus', 'Cognitive Ability', 'Professional Success'],
            shortBulletSummary: [
                'Focus is a superpower.',
                'Minimize distractions.',
                'Build a deep work habit.',
                'Measure your output.'
            ],
            chapters: [
                { title: 'The Idea', summary: 'Deep work is valuable and rare.' },
                { title: 'The Rules', summary: 'Work deeply, embrace boredom, quit social media, and drain the shallows.' }
            ]
        },
        createdAt: new Date().toISOString()
    },
    {
        id: 'thinking-fast-and-slow',
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        genre: 'Psychology',
        coverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1317793906i/11468377.jpg',
        publishedYear: 2011,
        tags: ['psychology', 'behavioral-economics', 'decision-making'],
        oneLiner: 'The Two Systems of Thought.',
        summary: {
            overview: 'Daniel Kahneman, a Nobel laureate in economics, takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.',
            keyTakeaways: [
                'System 1 is fast, intuitive, and emotional.',
                'System 2 is slower, more deliberative, and more logical.',
                'Heuristics and biases often lead to errors in judgment.',
                'Loss aversion influences our decision-making significantly.'
            ],
            detailedSummary: 'The book explores the dual-process model of the brain, identifying common cognitive biases and how they affect our everyday lives, from financial decisions to personal relationships.',
            howToApply: [
                'Recognize when System 1 is leading you astray.',
                'Engage System 2 for complex decisions.',
                'Be aware of the framing effect in communication.',
                'Understand the difference between the experiencing self and the remembering self.'
            ],
            themes: ['Cognition', 'Decision Science', 'Human Behavior'],
            shortBulletSummary: [
                'Two systems of thought.',
                'Cognitive biases.',
                'Heuristics in decision-making.',
                'Prospect theory.'
            ],
            chapters: [
                { title: 'Two Systems', summary: 'Introduction to System 1 and System 2.' },
                { title: 'Heuristics and Biases', summary: 'How we simplify complex judgments.' },
                { title: 'Overconfidence', summary: 'The illusion of understanding.' }
            ]
        },
        createdAt: new Date().toISOString()
    }
];

/**
 * Get related books based on shared tags or same author
 */
export function getRelatedBooks(book: Book, limit: number = 5): Book[] {
    const related = MOCK_BOOKS
        .filter(b => b.id !== book.id)
        .map(b => {
            let score = 0;

            if (b.author === book.author) {
                score += 3;
            }

            if (b.genre === book.genre) {
                score += 2;
            }

            const sharedTags = b.tags.filter(tag => book.tags.includes(tag));
            score += sharedTags.length;

            return { book: b, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.book);

    return related;
}

/**
  * Get all unique tags
  */
 export function getAllTags(): string[] {
     const tagSet = new Set<string>();
 
     MOCK_BOOKS.forEach(b => {
         b.tags.forEach(tag => tagSet.add(tag));
     });
 
     return Array.from(tagSet).sort();
 }
