'use client';

import { useState } from 'react';
import { Book } from '@/types/book';
import { ChevronDown, BookOpen, Lightbulb, Target, List, Zap, Target as Aim, Tag, Link as LinkIcon } from 'lucide-react';

export default function SummaryPanel({ book }: { book: Book }) {
    const { summary } = book;
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        overview: true,
        takeaways: true,
        detailed: false,
        apply: true,
        bulletSum: true,
        chapters: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (!summary) return null;

    return (
        <div className="space-y-4 p-4 sm:p-6">
            {/* One Liner (Displayed prominently if present) */}
            {book.oneLiner && (
                <div className="bg-teal-50 dark:bg-teal-900/30 p-4 rounded-xl border border-teal-100 dark:border-teal-800">
                    <h3 className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-1 flex items-center gap-2">
                        <Zap size={14} /> One-Liner
                    </h3>
                    <p className="text-lg font-medium text-gray-900 dark:text-white italic">
                        "{book.oneLiner}"
                    </p>
                </div>
            )}

            {/* Short Bullet Summary */}
            {summary.shortBulletSummary && summary.shortBulletSummary.length > 0 && (
                <SectionCard
                    title="Short Bullet Summary"
                    icon={<Zap size={18} className="text-yellow-500" />}
                    isExpanded={expandedSections.bulletSum}
                    onToggle={() => toggleSection('bulletSum')}
                >
                    <ul className="space-y-2">
                        {summary.shortBulletSummary.map((point, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </SectionCard>
            )}

            {/* Overview Section */}
            <SectionCard
                title="Full Overview"
                icon={<BookOpen size={18} className="text-blue-500" />}
                isExpanded={expandedSections.overview}
                onToggle={() => toggleSection('overview')}
            >
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {summary.overview}
                </p>
            </SectionCard>

            {/* Key Takeaways */}
            {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
                <SectionCard
                    title="Key Takeaways"
                    icon={<Lightbulb size={18} className="text-orange-500" />}
                    isExpanded={expandedSections.takeaways}
                    onToggle={() => toggleSection('takeaways')}
                >
                    <ul className="space-y-2">
                        {summary.keyTakeaways.map((point, index) => (
                            <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                </span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </SectionCard>
            )}

            {/* Detailed Summary */}
            {summary.detailedSummary && (
                <SectionCard
                    title="Detailed Analysis"
                    icon={<List size={18} className="text-purple-500" />}
                    isExpanded={expandedSections.detailed}
                    onToggle={() => toggleSection('detailed')}
                >
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed border-l-4 border-teal-500 pl-4 py-1">
                        {summary.detailedSummary}
                    </p>
                </SectionCard>
            )}

            {/* How to Apply */}
            {summary.howToApply && summary.howToApply.length > 0 && (
                <SectionCard
                    title="How to Apply"
                    icon={<Aim size={18} className="text-green-500" />}
                    isExpanded={expandedSections.apply}
                    onToggle={() => toggleSection('apply')}
                >
                    <ul className="space-y-3">
                        {summary.howToApply.map((point, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/50">
                                <span className="text-green-600 dark:text-green-400 mt-0.5">✅</span>
                                <span className="text-gray-800 dark:text-gray-200">{point}</span>
                            </li>
                        ))}
                    </ul>
                </SectionCard>
            )}

            {/* Chapters */}
            {summary.chapters && summary.chapters.length > 0 && (
                <SectionCard
                    title="Chapters"
                    icon={<Tag size={18} className="text-indigo-500" />}
                    isExpanded={expandedSections.chapters}
                    onToggle={() => toggleSection('chapters')}
                >
                    <div className="space-y-2">
                        {summary.chapters.map((chapter, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <span className="font-mono text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/50 px-2 py-1 rounded">
                                    CH {index + 1}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{chapter.title}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}
        </div>
    );
}

interface SectionCardProps {
    title: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function SectionCard({ title, icon, isExpanded, onToggle, children }: SectionCardProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-bold text-gray-900 dark:text-white">{title}</span>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700/50 pt-4">
                    {children}
                </div>
            )}
        </div>
    );
}
