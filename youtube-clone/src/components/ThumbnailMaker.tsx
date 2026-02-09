'use client';

import { useState, useRef, useEffect } from 'react';
import { Video } from '@/types/video';
import { useAdmin } from '@/context/AdminContext';

interface TextLayer {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    fontWeight: string;
}

interface ShapeLayer {
    id: string;
    type: 'rect' | 'circle';
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}

export default function ThumbnailMaker() {
    const { setCustomThumbnail } = useAdmin();
    const [isOpen, setIsOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Canvas State
    const [bgColor, setBgColor] = useState('#0f172a');
    const [texts, setTexts] = useState<TextLayer[]>([]);
    const [shapes, setShapes] = useState<ShapeLayer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleOpen = (e: any) => {
            setEditingVideo(e.detail);
            setIsOpen(true);
            // Reset state for new edit
            setBgColor('#0f172a');
            setTexts([
                {
                    id: 'title',
                    text: e.detail.title,
                    x: 50,
                    y: 100,
                    fontSize: 40,
                    color: '#ffffff',
                    fontFamily: 'Inter',
                    fontWeight: '800'
                }
            ]);
            setShapes([]);
        };

        window.addEventListener('open-thumbnail-maker' as any, handleOpen);
        return () => window.removeEventListener('open-thumbnail-maker' as any, handleOpen);
    }, []);

    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;
        draw();
    }, [isOpen, bgColor, texts, shapes, selectedLayerId]);

    const getCanvasMousePos = (e: React.MouseEvent | MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = getCanvasMousePos(e);

        // Hit detection (reverse order for top layer first)
        // 1. Check texts
        for (let i = texts.length - 1; i >= 0; i--) {
            const t = texts[i];
            const canvas = canvasRef.current;
            if (!canvas) continue;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            ctx.font = `${t.fontWeight} ${t.fontSize}px ${t.fontFamily}, sans-serif`;
            const metrics = ctx.measureText(t.text);

            if (pos.x >= t.x && pos.x <= t.x + metrics.width &&
                pos.y >= t.y && pos.y <= t.y + t.fontSize) {
                setSelectedLayerId(t.id);
                setDraggingId(t.id);
                setDragOffset({ x: pos.x - t.x, y: pos.y - t.y });
                return;
            }
        }

        // 2. Check shapes
        for (let i = shapes.length - 1; i >= 0; i--) {
            const s = shapes[i];
            if (pos.x >= s.x && pos.x <= s.x + s.width &&
                pos.y >= s.y && pos.y <= s.y + s.height) {
                setSelectedLayerId(s.id);
                setDraggingId(s.id);
                setDragOffset({ x: pos.x - s.x, y: pos.y - s.y });
                return;
            }
        }

        setSelectedLayerId(null);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!draggingId) return;
        const pos = getCanvasMousePos(e);

        const newX = Math.round(pos.x - dragOffset.x);
        const newY = Math.round(pos.y - dragOffset.y);

        setTexts(prev => prev.map(t => t.id === draggingId ? { ...t, x: newX, y: newY } : t));
        setShapes(prev => prev.map(s => s.id === draggingId ? { ...s, x: newX, y: newY } : s));
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Shapes
        shapes.forEach(shape => {
            ctx.fillStyle = shape.color;
            if (shape.type === 'rect') {
                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            } else {
                ctx.beginPath();
                ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw Texts
        texts.forEach(t => {
            ctx.fillStyle = t.color;
            ctx.font = `${t.fontWeight} ${t.fontSize}px ${t.fontFamily}, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(t.text, t.x, t.y);

            // Draw selection box if selected
            if (t.id === selectedLayerId) {
                const metrics = ctx.measureText(t.text);
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.strokeRect(t.x - 5, t.y - 5, metrics.width + 10, t.fontSize + 10);
            }
        });
    };

    useEffect(() => {
        if (draggingId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingId, dragOffset]);

    const handleSave = () => {
        if (!canvasRef.current || !editingVideo) return;
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        setCustomThumbnail(editingVideo.id, dataUrl);
        setIsOpen(false);
    };

    const addText = () => {
        const newText: TextLayer = {
            id: `text_${Date.now()}`,
            text: 'New Text',
            x: 100,
            y: 100,
            fontSize: 30,
            color: '#ffffff',
            fontFamily: 'Inter',
            fontWeight: '600'
        };
        setTexts([...texts, newText]);
        setSelectedLayerId(newText.id);
    };

    const addShape = (type: 'rect' | 'circle') => {
        const newShape: ShapeLayer = {
            id: `shape_${Date.now()}`,
            type,
            x: 200,
            y: 200,
            width: 200,
            height: 200,
            color: '#3b82f6'
        };
        setShapes([...shapes, newShape]);
        setSelectedLayerId(newShape.id);
    };

    const updateSelectedText = (updates: Partial<TextLayer>) => {
        setTexts(prev => prev.map(t => t.id === selectedLayerId ? { ...t, ...updates } : t));
    };

    const updateSelectedShape = (updates: Partial<ShapeLayer>) => {
        setShapes(prev => prev.map(s => s.id === selectedLayerId ? { ...s, ...updates } : s));
    };

    const deleteSelected = () => {
        setTexts(prev => prev.filter(t => t.id !== selectedLayerId));
        setShapes(prev => prev.filter(s => s.id !== selectedLayerId));
        setSelectedLayerId(null);
    };

    if (!isOpen) return null;

    const selectedText = texts.find(t => t.id === selectedLayerId);
    const selectedShape = shapes.find(s => s.id === selectedLayerId);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Thumbnail Designer</h2>
                        <p className="text-sm text-gray-500">Creating for: {editingVideo?.title}</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-8 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all">
                            Save Thumbnail
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar: Controls */}
                    <div className="w-80 border-r border-gray-200 dark:border-gray-800 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                        <section className="mb-8">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Background</h3>
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1"
                            />
                        </section>

                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Layers</h3>
                                <div className="flex gap-1">
                                    <button onClick={addText} className="text-[10px] bg-teal-500/10 text-teal-600 font-bold px-2 py-1 rounded hover:bg-teal-500/20 transition-colors border border-teal-500/20">
                                        + Text
                                    </button>
                                    <button onClick={() => addShape('rect')} className="text-[10px] bg-blue-500/10 text-blue-600 font-bold px-2 py-1 rounded hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                                        + Rect
                                    </button>
                                    <button onClick={() => addShape('circle')} className="text-[10px] bg-indigo-500/10 text-indigo-600 font-bold px-2 py-1 rounded hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
                                        + Circle
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {texts.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedLayerId(t.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${selectedLayerId === t.id
                                            ? 'bg-teal-500 border-teal-500 text-white'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-teal-500/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs">T</span>
                                            <div className="truncate text-xs font-medium">{t.text}</div>
                                        </div>
                                    </button>
                                ))}
                                {shapes.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedLayerId(s.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${selectedLayerId === s.id
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-500/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs">{s.type === 'rect' ? '■' : '●'}</span>
                                            <div className="truncate text-xs font-medium">Shape ({s.type})</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {selectedText && (
                            <section className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-500">Text Props</h3>
                                    <button onClick={deleteSelected} className="text-[10px] text-red-500 font-bold hover:underline">Delete</button>
                                </div>

                                <div>
                                    <textarea
                                        value={selectedText.text}
                                        onChange={(e) => updateSelectedText({ text: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-teal-500 resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Size</label>
                                        <input type="number" value={selectedText.fontSize} onChange={(e) => updateSelectedText({ fontSize: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Color</label>
                                        <input type="color" value={selectedText.color} onChange={(e) => updateSelectedText({ color: e.target.value })} className="w-full h-9 rounded-xl cursor-pointer p-0.5" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">X</label>
                                        <input type="number" value={selectedText.x} onChange={(e) => updateSelectedText({ x: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Y</label>
                                        <input type="number" value={selectedText.y} onChange={(e) => updateSelectedText({ y: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" />
                                    </div>
                                </div>
                            </section>
                        )}

                        {selectedShape && (
                            <section className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">Shape Props</h3>
                                    <button onClick={deleteSelected} className="text-[10px] text-red-500 font-bold hover:underline">Delete</button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Width</label>
                                        <input type="number" value={selectedShape.width} onChange={(e) => updateSelectedShape({ width: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Height</label>
                                        <input type="number" value={selectedShape.height} onChange={(e) => updateSelectedShape({ height: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Color</label>
                                    <input type="color" value={selectedShape.color} onChange={(e) => updateSelectedShape({ color: e.target.value })} className="w-full h-9 rounded-xl cursor-pointer p-0.5" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">X</label>
                                        <input type="number" value={selectedShape.x} onChange={(e) => updateSelectedShape({ x: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Y</label>
                                        <input type="number" value={selectedShape.y} onChange={(e) => updateSelectedShape({ y: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" />
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 bg-gray-200 dark:bg-[#020617] p-12 flex items-center justify-center overflow-auto">
                        <div className="relative shadow-2xl rounded-lg overflow-hidden border-8 border-white dark:border-gray-800">
                            <canvas
                                ref={canvasRef}
                                width={1280}
                                height={720}
                                onMouseDown={handleMouseDown}
                                className={`max-w-full h-auto bg-white shadow-inner cursor-crosshair ${draggingId ? 'cursor-grabbing' : ''}`}
                                style={{ width: '800px' }} // Preview size
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
