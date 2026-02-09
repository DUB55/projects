'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Summary, Video } from '@/types/video';

interface SummaryPanelProps {
    video: Video;
}

export default function SummaryPanel({ video }: SummaryPanelProps) {
    const { summary } = video;
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        overview: true,
        takeaways: true,
        chapters: false,
        entities: false,
        links: false,
        apply: true,
        bulletSum: true,
        conciseMean: true
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="space-y-4">
            {/* One Liner (Displayed prominently if present) */}
            {video.oneLiner && (
                <div className="bg-teal-50 dark:bg-teal-900/30 p-4 rounded-xl border border-teal-100 dark:border-teal-800">
                    <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-1">
                        One-Liner
                    </h3>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {video.oneLiner}
                    </p>
                </div>
            )}

            {/* Short Bullet Summary */}
            {summary.shortBulletSummary && summary.shortBulletSummary.length > 0 && (
                <SectionCard
                    title="Short Bullet Summary"
                    icon="⚡"
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

            {/* Concise Complete Summary */}
            {summary.conciseCompleteSummary && (
                <SectionCard
                    title="Concise Complete Summary"
                    icon="🎯"
                    isExpanded={expandedSections.conciseMean}
                    onToggle={() => toggleSection('conciseMean')}
                >
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic border-l-4 border-teal-500 pl-4 py-1">
                        {summary.conciseCompleteSummary}
                    </p>
                </SectionCard>
            )}

            {/* Overview Section */}
            <SectionCard
                title="Full Overview"
                icon="📄"
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
                    icon="💡"
                    isExpanded={expandedSections.takeaways}
                    onToggle={() => toggleSection('takeaways')}
                >
                    <ul className="space-y-2">
                        {summary.keyTakeaways.map((point, index) => (
                            <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                </span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </SectionCard>
            )}

            {/* How to Apply */}
            {summary.howToApply && summary.howToApply.length > 0 && (
                <SectionCard
                    title="How to Apply"
                    icon="🚀"
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
                    icon="📑"
                    isExpanded={expandedSections.chapters}
                    onToggle={() => toggleSection('chapters')}
                >
                    <div className="space-y-2">
                        {summary.chapters.map((chapter, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <span className="font-mono text-sm text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/50 px-2 py-1 rounded">
                                    {chapter.timecode}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">{chapter.title}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Entities/Topics */}
            {summary.entities && summary.entities.length > 0 && (
                <SectionCard
                    title="Topics & Entities"
                    icon="🏷️"
                    isExpanded={expandedSections.entities}
                    onToggle={() => toggleSection('entities')}
                >
                    <div className="flex flex-wrap gap-2">
                        {summary.entities.map((entity, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-gradient-to-r from-purple-100 to-teal-100 dark:from-purple-900/50 dark:to-teal-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                            >
                                {entity}
                            </span>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* External Links */}
            {summary.links && summary.links.length > 0 && (
                <SectionCard
                    title="Resources & Links"
                    icon="🔗"
                    isExpanded={expandedSections.links}
                    onToggle={() => toggleSection('links')}
                >
                    <div className="space-y-2">
                        {summary.links.map((link, index) => (
                            <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            >
                                <span className="text-teal-600 dark:text-teal-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                    {link.label}
                                </span>
                            </a>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Watch on YouTube Button */}
            <a
                href={video.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
            >
                <span>▶️</span>
                <span>Watch Original on YouTube</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        </div>
    );
}

// Collapsible Section Card Component
interface SectionCardProps {
    title: string;
    icon: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function SectionCard({ title, icon, isExpanded, onToggle, children }: SectionCardProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{title}</span>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    {children}
                </div>
            )}
        </div>
    );
}
