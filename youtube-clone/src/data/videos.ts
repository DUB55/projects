import { Video } from '@/types/video';

// Seed data for StreamSummarize
const videos: Video[] = [
    {
        id: "vid_ai_transformers",
        type: "video",
        title: "Transformers Explained Simply",
        channel: "ML Simplified",
        channelId: "ml_simplified",
        thumbnailUrl: "/thumbs/transformers.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        duration: 780,
        publishedAt: "2024-01-15T12:00:00Z",
        language: "en",
        tags: ["ai", "ml", "nlp", "transformers"],
        summary: {
            overview: "High-level intro to the Transformer architecture and why attention matters. This video breaks down the complex concepts into digestible pieces for beginners.",
            keyTakeaways: [
                "Self-attention captures long-range dependencies efficiently.",
                "Positional encodings replace recurrence.",
                "Scaling laws favor larger models with sufficient data.",
                "Transformers are the foundation of modern LLMs."
            ],
            chapters: [
                { timecode: "00:00", title: "Motivation" },
                { timecode: "02:35", title: "Self-Attention" },
                { timecode: "05:20", title: "Multi-Head Attention" },
                { timecode: "08:10", title: "Applications" }
            ],
            entities: ["Vaswani et al.", "Attention", "BERT", "GPT"],
            links: [
                { label: "Original Paper", url: "https://arxiv.org/abs/1706.03762" },
                { label: "Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/" }
            ]
        },
        createdAt: "2024-01-01T00:00:00Z"
    },
    {
        id: "vid_python_basics",
        type: "video",
        title: "Python for Beginners - Complete Course",
        channel: "Code Academy",
        channelId: "code_academy",
        thumbnailUrl: "/thumbs/python.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=example1",
        duration: 3600,
        publishedAt: "2024-02-20T10:00:00Z",
        language: "en",
        tags: ["python", "programming", "tutorial", "beginner"],
        summary: {
            overview: "A comprehensive introduction to Python programming covering variables, data types, control flow, functions, and object-oriented programming basics.",
            keyTakeaways: [
                "Python uses indentation for code blocks.",
                "Variables are dynamically typed.",
                "Lists, dictionaries, and tuples are core data structures.",
                "Functions are defined with the def keyword.",
                "Classes enable object-oriented programming."
            ],
            chapters: [
                { timecode: "00:00", title: "Introduction" },
                { timecode: "10:00", title: "Variables & Data Types" },
                { timecode: "25:00", title: "Control Flow" },
                { timecode: "40:00", title: "Functions" },
                { timecode: "55:00", title: "OOP Basics" }
            ],
            entities: ["Python", "Guido van Rossum", "PEP8"],
            links: [
                { label: "Python Docs", url: "https://docs.python.org/3/" }
            ]
        },
        createdAt: "2024-02-01T00:00:00Z"
    },
    {
        id: "vid_react_hooks",
        type: "video",
        title: "React Hooks Deep Dive",
        channel: "Frontend Masters",
        channelId: "frontend_masters",
        thumbnailUrl: "/thumbs/react.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=example2",
        duration: 1800,
        publishedAt: "2024-03-10T14:00:00Z",
        language: "en",
        tags: ["react", "javascript", "hooks", "frontend"],
        summary: {
            overview: "Deep dive into React Hooks including useState, useEffect, useContext, useReducer, and custom hooks. Learn best practices and common patterns.",
            keyTakeaways: [
                "useState manages local component state.",
                "useEffect handles side effects and cleanup.",
                "useContext provides global state without prop drilling.",
                "Custom hooks enable reusable logic.",
                "Rules of hooks must be followed strictly."
            ],
            chapters: [
                { timecode: "00:00", title: "Why Hooks?" },
                { timecode: "05:00", title: "useState" },
                { timecode: "12:00", title: "useEffect" },
                { timecode: "20:00", title: "useContext & useReducer" },
                { timecode: "28:00", title: "Custom Hooks" }
            ],
            entities: ["React", "Dan Abramov", "Facebook"],
            links: [
                { label: "React Hooks Docs", url: "https://react.dev/reference/react" }
            ]
        },
        createdAt: "2024-03-01T00:00:00Z"
    },
    {
        id: "vid_css_grid",
        type: "video",
        title: "CSS Grid Layout Masterclass",
        channel: "Frontend Masters",
        channelId: "frontend_masters",
        thumbnailUrl: "/thumbs/css-grid.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=example3",
        duration: 2400,
        publishedAt: "2024-01-25T16:00:00Z",
        language: "en",
        tags: ["css", "grid", "layout", "frontend"],
        summary: {
            overview: "Master CSS Grid Layout with practical examples. Learn to create complex responsive layouts with minimal code.",
            keyTakeaways: [
                "Grid creates two-dimensional layouts.",
                "grid-template-areas provides named grid regions.",
                "fr unit distributes available space.",
                "minmax() creates flexible columns.",
                "Grid and Flexbox complement each other."
            ],
            chapters: [
                { timecode: "00:00", title: "Grid Basics" },
                { timecode: "10:00", title: "Grid Template" },
                { timecode: "20:00", title: "Grid Areas" },
                { timecode: "30:00", title: "Responsive Patterns" }
            ],
            entities: ["CSS Working Group", "W3C"],
            links: [
                { label: "CSS Grid Guide", url: "https://css-tricks.com/snippets/css/complete-guide-grid/" }
            ]
        },
        createdAt: "2024-01-25T00:00:00Z"
    },
    {
        id: "vid_typescript_intro",
        type: "video",
        title: "TypeScript Essentials",
        channel: "Code Academy",
        channelId: "code_academy",
        thumbnailUrl: "/thumbs/typescript.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=example4",
        duration: 2700,
        publishedAt: "2024-04-05T09:00:00Z",
        language: "en",
        tags: ["typescript", "javascript", "programming", "types"],
        summary: {
            overview: "Learn TypeScript from scratch. Understand types, interfaces, generics, and how TypeScript improves JavaScript development.",
            keyTakeaways: [
                "TypeScript adds static typing to JavaScript.",
                "Interfaces define object shapes.",
                "Generics enable reusable typed components.",
                "Type inference reduces boilerplate.",
                "Strict mode catches more errors."
            ],
            chapters: [
                { timecode: "00:00", title: "Why TypeScript?" },
                { timecode: "08:00", title: "Basic Types" },
                { timecode: "18:00", title: "Interfaces" },
                { timecode: "30:00", title: "Generics" },
                { timecode: "42:00", title: "Advanced Types" }
            ],
            entities: ["Microsoft", "Anders Hejlsberg"],
            links: [
                { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/" }
            ]
        },
        createdAt: "2024-04-01T00:00:00Z"
    },
    {
        id: "short_git_tips",
        type: "short",
        title: "5 Git Commands You Should Know",
        channel: "Dev Tips",
        channelId: "dev_tips",
        thumbnailUrl: "/thumbs/git-short.jpg",
        sourceUrl: "https://www.youtube.com/shorts/example5",
        duration: 58,
        publishedAt: "2024-05-01T12:00:00Z",
        language: "en",
        tags: ["git", "tips", "programming"],
        summary: {
            overview: "Quick tips on essential Git commands for everyday development workflow.",
            keyTakeaways: [
                "git stash saves work in progress.",
                "git cherry-pick applies specific commits.",
                "git rebase -i allows commit editing.",
                "git reflog recovers lost commits.",
                "git bisect finds bug-introducing commits."
            ],
            chapters: [],
            entities: ["Git", "Linus Torvalds"],
            links: []
        },
        createdAt: "2024-05-01T00:00:00Z"
    },
    {
        id: "short_css_tricks",
        type: "short",
        title: "CSS Trick: Perfect Centering",
        channel: "Dev Tips",
        channelId: "dev_tips",
        thumbnailUrl: "/thumbs/css-short.jpg",
        sourceUrl: "https://www.youtube.com/shorts/example6",
        duration: 45,
        publishedAt: "2024-05-15T14:00:00Z",
        language: "en",
        tags: ["css", "tips", "frontend"],
        summary: {
            overview: "The simplest way to center elements in CSS using modern techniques.",
            keyTakeaways: [
                "display: grid; place-items: center; is the easiest method.",
                "Flexbox with justify-content and align-items also works.",
                "margin: auto works for block elements with fixed width."
            ],
            chapters: [],
            entities: ["CSS"],
            links: []
        },
        createdAt: "2024-05-15T00:00:00Z"
    },
    {
        id: "short_js_tips",
        type: "short",
        title: "JavaScript Array Methods in 60s",
        channel: "Dev Tips",
        channelId: "dev_tips",
        thumbnailUrl: "/thumbs/js-short.jpg",
        sourceUrl: "https://www.youtube.com/shorts/example7",
        duration: 60,
        publishedAt: "2024-06-01T10:00:00Z",
        language: "en",
        tags: ["javascript", "tips", "arrays"],
        summary: {
            overview: "Quick overview of the most useful JavaScript array methods.",
            keyTakeaways: [
                "map() transforms each element.",
                "filter() keeps matching elements.",
                "reduce() accumulates values.",
                "find() returns first match.",
                "some() and every() check conditions."
            ],
            chapters: [],
            entities: ["JavaScript", "ECMAScript"],
            links: []
        },
        createdAt: "2024-06-01T00:00:00Z"
    },
    {
        id: "vid_nextjs_tutorial",
        type: "video",
        title: "Next.js 14 Complete Tutorial",
        channel: "Web Dev Pro",
        channelId: "web_dev_pro",
        thumbnailUrl: "/thumbs/nextjs.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=example8",
        duration: 5400,
        publishedAt: "2024-03-20T08:00:00Z",
        language: "en",
        tags: ["nextjs", "react", "fullstack", "tutorial"],
        summary: {
            overview: "Complete guide to Next.js 14 covering App Router, Server Components, Server Actions, and deployment strategies.",
            keyTakeaways: [
                "App Router is the recommended approach in Next.js 14.",
                "Server Components reduce client-side JavaScript.",
                "Server Actions handle form submissions without API routes.",
                "Static and dynamic rendering can be mixed.",
                "Middleware enables edge computing."
            ],
            chapters: [
                { timecode: "00:00", title: "Introduction to Next.js 14" },
                { timecode: "15:00", title: "App Router Basics" },
                { timecode: "35:00", title: "Server Components" },
                { timecode: "55:00", title: "Data Fetching" },
                { timecode: "75:00", title: "Server Actions" },
                { timecode: "90:00", title: "Deployment" }
            ],
            entities: ["Vercel", "Next.js", "React"],
            links: [
                { label: "Next.js Docs", url: "https://nextjs.org/docs" }
            ]
        },
        createdAt: "2024-03-20T00:00:00Z"
    },
    {
        id: "vid_docker_basics",
        type: "video",
        title: "Docker for Developers",
        channel: "DevOps Journey",
        channelId: "devops_journey",
        thumbnailUrl: "/thumbs/docker.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=example9",
        duration: 3000,
        publishedAt: "2024-02-10T11:00:00Z",
        language: "en",
        tags: ["docker", "devops", "containers", "deployment"],
        summary: {
            overview: "Learn Docker fundamentals including containers, images, volumes, and Docker Compose for local development.",
            keyTakeaways: [
                "Containers package apps with all dependencies.",
                "Dockerfiles define how to build images.",
                "Volumes persist data between container restarts.",
                "Docker Compose manages multi-container apps.",
                "Docker Hub hosts public images."
            ],
            chapters: [
                { timecode: "00:00", title: "What is Docker?" },
                { timecode: "10:00", title: "Docker Installation" },
                { timecode: "18:00", title: "Dockerfile Deep Dive" },
                { timecode: "30:00", title: "Volumes & Networks" },
                { timecode: "45:00", title: "Docker Compose" }
            ],
            entities: ["Docker", "Solomon Hykes", "Linux containers"],
            links: [
                { label: "Docker Docs", url: "https://docs.docker.com/" }
            ]
        },
        createdAt: "2024-02-10T00:00:00Z"
    },
    {
        id: "vid_sql_fundamentals",
        type: "video",
        title: "SQL Database Fundamentals",
        channel: "Data School",
        channelId: "data_school",
        thumbnailUrl: "/thumbs/sql.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=example10",
        duration: 4200,
        publishedAt: "2024-01-08T15:00:00Z",
        language: "en",
        tags: ["sql", "database", "backend", "data"],
        summary: {
            overview: "Comprehensive SQL tutorial covering SELECT, JOIN, GROUP BY, subqueries, and database design principles.",
            keyTakeaways: [
                "SELECT retrieves data from tables.",
                "JOIN combines data from multiple tables.",
                "GROUP BY aggregates data with functions.",
                "Indexes improve query performance.",
                "Normalization reduces data redundancy."
            ],
            chapters: [
                { timecode: "00:00", title: "Database Concepts" },
                { timecode: "12:00", title: "SELECT Queries" },
                { timecode: "28:00", title: "Filtering & Sorting" },
                { timecode: "45:00", title: "JOINs Explained" },
                { timecode: "60:00", title: "Aggregation & Grouping" }
            ],
            entities: ["PostgreSQL", "MySQL", "SQLite"],
            links: [
                { label: "SQL Tutorial", url: "https://www.w3schools.com/sql/" }
            ]
        },
        createdAt: "2024-01-08T00:00:00Z"
    },
    {
        id: "short_react_tips",
        type: "short",
        title: "React Performance Tips",
        channel: "Frontend Masters",
        channelId: "frontend_masters",
        thumbnailUrl: "/thumbs/react-short.jpg",
        sourceUrl: "https://www.youtube.com/shorts/example11",
        duration: 55,
        publishedAt: "2024-06-10T16:00:00Z",
        language: "en",
        tags: ["react", "performance", "tips"],
        summary: {
            overview: "Quick React performance optimization techniques.",
            keyTakeaways: [
                "Use React.memo for expensive components.",
                "useMemo caches computed values.",
                "useCallback prevents function recreation.",
                "Lazy loading reduces initial bundle size."
            ],
            chapters: [],
            entities: ["React"],
            links: []
        },
        createdAt: "2024-06-10T00:00:00Z"
    }
];

export default videos;
