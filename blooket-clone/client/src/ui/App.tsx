import React, { useMemo, useState } from "react";
import { createSocket } from "../lib/socket";

type Choice = { text: string };
type Question = { prompt: string; choices: Choice[]; correctIndex: number; timeLimitSec?: number };
type QuestionSet = { title: string; questions: Question[] };

type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Glitch";

interface Sphere {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  cost: number;
}

const SPHERES: Sphere[] = [
  { id: "default", name: "Default", emoji: "⚪", rarity: "Common", cost: 0 },
  { id: "fire", name: "Fire Spirit", emoji: "🔥", rarity: "Common", cost: 50 },
  { id: "water", name: "Water Drop", emoji: "💧", rarity: "Common", cost: 50 },
  { id: "leaf", name: "Leafy", emoji: "🍃", rarity: "Common", cost: 100 },
  { id: "star", name: "Superstar", emoji: "⭐", rarity: "Rare", cost: 250 },
  { id: "moon", name: "Moonlight", emoji: "🌙", rarity: "Rare", cost: 250 },
  { id: "dragon", name: "Dragon", emoji: "🐲", rarity: "Epic", cost: 750 },
  { id: "alien", name: "Invader", emoji: "👽", rarity: "Epic", cost: 1000 },
  { id: "king", name: "King", emoji: "👑", rarity: "Legendary", cost: 2500 },
  { id: "wizard", name: "Wizard", emoji: "🧙", rarity: "Legendary", cost: 5000 },
  { id: "hacker", name: "System Glitch", emoji: "👾", rarity: "Glitch", cost: 100000 },
  { id: "viking", name: "Viking", emoji: "🪓", rarity: "Epic", cost: 1200 },
  { id: "samurai", name: "Samurai", emoji: "⚔️", rarity: "Epic", cost: 1200 },
  { id: "astronaut", name: "Astronaut", emoji: "👨‍🚀", rarity: "Legendary", cost: 3500 },
  { id: "unicorn", name: "Unicorn", emoji: "🦄", rarity: "Legendary", cost: 4000 },
  { id: "phoenix", name: "Phoenix", emoji: "🐦‍🔥", rarity: "Glitch", cost: 250000 },
];

interface PowerUp {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
}

const POWERUPS: PowerUp[] = [
  { id: "double_points", name: "Double Points", icon: "keyboard_double_arrow_up", description: "Earn 2x points for the next correct answer.", cost: 150 },
  { id: "shield", name: "Shield", icon: "shield", description: "Protects your streak if you get a question wrong.", cost: 200 },
  { id: "freeze", name: "Freeze", icon: "ac_unit", description: "Freezes another player's screen for 5 seconds.", cost: 300 },
  { id: "thief", name: "Points Thief", icon: "person_search", description: "Steal 10% of the leader's points.", cost: 500 },
];

type View = "home" | "host" | "player" | "features" | "about" | "market";

export interface CafePlayerViewProps {
  cafe: { 
    money: number; 
    customersServed: number; 
    stock: Record<string, number>; 
    upgrades: Record<string, number>;
    customers: { id: string; item: string; patience: number }[];
  };
  players: Record<string, any>;
  code: string;
  socket: any;
  status: string;
  currentQ: any;
  qIndex: number;
  selected: number | null;
  answer: (index: number) => void;
}

interface TDPlayerViewProps {
  td: { tokens: number; health: number; wave: number; towers: any[] };
  code: string;
  socket: any;
  status: string;
  currentQ: any;
  qIndex: number;
  selected: number | null;
  answer: (index: number) => void;
}

function TDPlayerView({ td, code, socket, status, currentQ, qIndex, selected, answer }: TDPlayerViewProps) {
  const [tab, setTab] = useState<"defend" | "restock" | "shop">("defend");
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [activeTowerIndex, setActiveTowerIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const TOWERS = [
    { id: "archer", name: "Archer", icon: "rebase", cost: 10, color: "bg-green-500", desc: "Fast attack speed", range: 1.5, damage: 2, upgradeCost: 15 },
    { id: "mage", name: "Mage", icon: "magic_button", cost: 20, color: "bg-purple-500", desc: "Area damage", range: 2, damage: 4, upgradeCost: 25 },
    { id: "cannon", name: "Cannon", icon: "explosion", cost: 30, color: "bg-gray-500", desc: "Heavy damage", range: 1.2, damage: 10, upgradeCost: 40 },
  ];

  const [enemies, setEnemies] = useState<{ id: number; hp: number; maxHp: number; x: number; y: number; type: 'normal' | 'fast' | 'tank' }[]>([]);
  const [projectiles, setProjectiles] = useState<{ id: number; x: number; y: number; targetX: number; targetY: number; color: string }[]>([]);
  const [hits, setHits] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [enemyTimer, setEnemyTimer] = useState<NodeJS.Timeout | null>(null);

  // Simple wave simulation for visual feedback
  React.useEffect(() => {
    if (tab === "defend" && status === "question") {
      const timer = setInterval(() => {
        setEnemies(prev => {
          // Move existing enemies
          const moved = prev.map(e => {
            let speed = 0.08;
            if (e.type === 'fast') speed = 0.15;
            if (e.type === 'tank') speed = 0.04;
            return { ...e, x: e.x + speed };
          }).filter(e => e.x < 5);
          
          // Spawn new enemy randomly
          if (Math.random() > 0.92) {
            const types: ('normal' | 'fast' | 'tank')[] = ['normal', 'fast', 'tank'];
            const type = types[Math.floor(Math.random() * types.length)];
            let hp = 10;
            if (type === 'fast') hp = 5;
            if (type === 'tank') hp = 25;
            
            // Adjust HP based on wave
            hp *= (1 + (td.wave - 1) * 0.2);

            moved.push({ id: Date.now(), hp, maxHp: hp, x: 0, y: Math.floor(Math.random() * 5), type });
          }

          // Towers attack
          td.towers.forEach(t => {
            const towerData = TOWERS.find(tower => tower.id === t.id);
            if (!towerData) return;

            // Find closest enemy in range
            let target: any = null;
            let minDist = Infinity;

            moved.forEach(e => {
              const dist = Math.sqrt(Math.pow(t.x - e.x, 2) + Math.pow(t.y - e.y, 2));
              const range = towerData.range * (1 + (t.level - 1) * 0.2);
              if (dist <= range && dist < minDist) {
                minDist = dist;
                target = e;
              }
            });

            if (target) {
              const damage = towerData.damage * (1 + (t.level - 1) * 0.5);
              target.hp -= damage * 0.1; // 0.1 because interval is 100ms
              
              // Add projectile
              if (Math.random() > 0.7) { // Don't show too many projectiles
                const projId = Math.random();
                setProjectiles(curr => [
                  ...curr.slice(-10), // Keep only last 10
                  { 
                    id: projId, 
                    x: t.x + 0.5, 
                    y: t.y + 0.5, 
                    targetX: target.x + 0.5, 
                    targetY: target.y + 0.5,
                    color: towerData.color.replace('bg-', 'text-')
                  }
                ]);

                // Add hit effect near target
                setTimeout(() => {
                  setHits(h => [...h.slice(-5), { id: Math.random(), x: target.x + 0.5, y: target.y + 0.5, color: towerData.color.replace('bg-', 'bg-') }]);
                  setTimeout(() => setHits(h => h.filter(x => x.id !== projId)), 300);
                }, 200);
              }
            }
          });

          // Check for damage to player
          const reachedEnd = prev.filter(e => e.x >= 5);
          if (reachedEnd.length > 0) {
            socket.emit("td:damage", { code, amount: reachedEnd.length });
          }

          return moved.filter(e => e.hp > 0);
        });

        // Update projectiles
        setProjectiles(curr => 
          curr.map(p => ({
            ...p,
            x: p.x + (p.targetX - p.x) * 0.3,
            y: p.y + (p.targetY - p.y) * 0.3
          })).filter(p => Math.abs(p.x - p.targetX) > 0.1)
        );
      }, 100);

      setEnemyTimer(timer);
      return () => clearInterval(timer);
    } else {
      setEnemies([]);
    }
  }, [tab, status, td.towers, td.wave]);

  // Effect to clear feedback
  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const grid = Array(25).fill(null);

  const activeTower = activeTowerIndex !== null ? td.towers[activeTowerIndex] : null;
  const activeTowerData = activeTower ? TOWERS.find(t => t.id === activeTower.id) : null;

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      {/* Global Feedback Overlay */}
      {feedback && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in slide-in-from-top-8 duration-300 border backdrop-blur-md ${
          feedback.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-3 font-black uppercase tracking-widest text-sm">
            <span className="material-symbols-outlined">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {feedback.message}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl relative overflow-hidden group/stats gap-4 sm:gap-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-30 group-hover/stats:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute -bottom-12 -left-12 size-32 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover/stats:opacity-100 transition-opacity duration-1000"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto relative z-10">
          <div className="flex flex-col group/token">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/token:text-primary transition-colors">Available Tokens</span>
            <div className="flex items-center gap-3">
              <div className="size-7 sm:size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover/token:scale-110 group-hover/token:rotate-12 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <span className="material-symbols-outlined text-lg sm:text-xl">token</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white tabular-nums group-hover/token:translate-x-1 transition-transform">{td.tokens.toLocaleString()}</span>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
          <div className="flex flex-col w-full sm:w-auto group/health">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/health:text-red-400 transition-colors">Defense integrity</span>
            <div className="flex items-center gap-4">
              <div className="flex-1 sm:w-32 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                <div 
                  className={`h-full transition-all duration-1000 relative z-10 ${td.health > 5 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
                  style={{ width: `${(td.health / 10) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-black text-white shrink-0 group-hover/health:scale-110 transition-transform">{td.health}/10</span>
            </div>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 relative z-10">
          <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest sm:mb-1">Current Wave</span>
          <div className="bg-primary/20 text-primary px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border border-primary/30 shadow-lg shadow-primary/10 hover:bg-primary hover:text-white transition-all duration-500 cursor-default">
            Phase {td.wave}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
        {(["defend", "restock", "shop"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setActiveTowerIndex(null);
            }}
            className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 flex items-center justify-center gap-2 ${
              tab === t 
                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {t === 'defend' ? 'shield' : t === 'restock' ? 'quiz' : 'shopping_cart'}
            </span>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col">
        {tab === "defend" && (
          <div className="h-full flex flex-col gap-6">
            <div className="flex-1 grid grid-cols-5 gap-2 relative">
              {grid.map((_, i) => {
                const tx = i % 5;
                const ty = Math.floor(i / 5);
                const towerIndex = td.towers.findIndex(t => t.x === tx && t.y === ty);
                const towerAtPos = towerIndex !== -1 ? td.towers[towerIndex] : null;
                const isSelected = activeTowerIndex === towerIndex && towerIndex !== -1;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (towerAtPos) {
                        setActiveTowerIndex(towerIndex);
                        setSelectedTower(null);
                      } else if (selectedTower) {
                        const towerData = TOWERS.find(t => t.id === selectedTower);
                        if (td.tokens >= (towerData?.cost || 0)) {
                          socket.emit("td:build", { code, towerId: selectedTower, x: tx, y: ty });
                          setFeedback({ type: 'success', message: `${towerData?.name} Built!` });
                          setSelectedTower(null);
                        } else {
                          setFeedback({ type: 'error', message: 'Not enough tokens!' });
                        }
                      } else {
                        setActiveTowerIndex(null);
                      }
                    }}
                    className={`aspect-square rounded-xl sm:rounded-2xl border-2 transition-all duration-500 flex items-center justify-center relative group/cell overflow-hidden ${
                      towerAtPos 
                        ? `${TOWERS.find(t => t.id === towerAtPos.id)?.color} ${isSelected ? 'border-white scale-[1.1] z-10 shadow-[0_0_50px_rgba(255,255,255,0.4)]' : 'border-white/20 hover:border-white/40 hover:scale-[1.05] hover:z-10'} text-white shadow-xl` 
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-primary/40 hover:scale-[1.05] hover:z-10"
                    }`}
                  >
                    {/* Background Glow for empty cells on hover */}
                    {!towerAtPos && (
                      <div className="absolute inset-0 bg-primary/0 group-hover/cell:bg-primary/10 transition-all duration-700 blur-2xl"></div>
                    )}
                    
                    {towerAtPos && (
                      <>
                        <div className="relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transform group-hover/cell:scale-110 group-hover/cell:rotate-6 transition-all duration-500">
                          <span className="material-symbols-outlined text-2xl xs:text-3xl sm:text-4xl">{TOWERS.find(t => t.id === towerAtPos.id)?.icon}</span>
                        </div>
                        {towerAtPos.level > 1 && (
                          <div className="absolute top-1 xs:top-1.5 right-1 xs:right-1.5 bg-white text-black text-[7px] xs:text-[9px] font-black w-3.5 h-3.5 xs:w-5 xs:h-5 rounded-md xs:rounded-lg flex items-center justify-center border border-white/20 shadow-lg z-20 animate-in zoom-in duration-500">
                            {towerAtPos.level}
                            {towerAtPos.level >= 3 && <div className="absolute inset-0 rounded-md xs:rounded-lg border border-primary/40 animate-ping opacity-30"></div>}
                          </div>
                        )}
                        {/* Interactive Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 -translate-x-full group-hover/cell:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                        
                        {/* Status Pulse for active towers */}
                        {status === "question" && (
                          <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                        )}
                      </>
                    )}

                    {/* Build Indicator when a tower is selected */}
                    {selectedTower && !towerAtPos && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
                        <div className="relative">
                          <span className="material-symbols-outlined text-primary text-xl xs:text-3xl animate-in zoom-in duration-300 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]">add_circle</span>
                          <div className="absolute inset-0 bg-primary/40 blur-lg rounded-full animate-ping opacity-20"></div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Enemy Overlay */}
              {enemies.map(e => (
                <div 
                  key={e.id}
                  className={`absolute size-12 flex items-center justify-center transition-all duration-100 z-20 ${
                    e.type === 'tank' ? 'scale-125' : e.type === 'fast' ? 'scale-90' : 'scale-110'
                  }`}
                  style={{ 
                    left: `${(e.x / 5) * 100}%`, 
                    top: `${(e.y / 5) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative">
                    <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                      {e.type === 'fast' ? '⚡' : e.type === 'tank' ? '🛡️' : '💀'}
                    </span>
                    {/* Hit Flash Effect (simulated via scale/opacity) */}
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl opacity-0 animate-pulse"></div>
                  </div>
                  
                  {/* Enhanced Health Bar */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden border border-white/10 p-[1px]">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        (e.hp / e.maxHp) > 0.5 ? 'bg-green-500' : (e.hp / e.maxHp) > 0.2 ? 'bg-amber-500' : 'bg-red-500'
                      } shadow-[0_0_8px_rgba(34,197,94,0.4)]`} 
                      style={{ width: `${(e.hp / e.maxHp) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              {/* Projectile Overlay */}
              {projectiles.map(p => (
                <div 
                  key={p.id}
                  className={`absolute size-2.5 rounded-full ${p.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor] transition-all duration-100 z-10`}
                  style={{ 
                    left: `${(p.x / 5) * 100}%`, 
                    top: `${(p.y / 5) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    color: p.color.includes('text-') ? `var(--${p.color.replace('text-', '')})` : p.color
                  }}
                >
                  <div className="absolute inset-0 rounded-full animate-ping opacity-40 bg-current"></div>
                </div>
              ))}

              {/* Hits Overlay */}
              {hits.map(h => (
                <div 
                  key={h.id}
                  className={`absolute size-6 rounded-full ${h.color} animate-out fade-out zoom-out duration-300 z-30`}
                  style={{ 
                    left: `${(h.x / 5) * 100}%`, 
                    top: `${(h.y / 5) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: h.color.replace('text-', 'rgba(var(--primary-rgb), 0.5)') // Fallback
                  }}
                >
                  <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
                </div>
              ))}

              {/* Range Circle */}
              {activeTower && activeTowerData && (
                <div 
                  className="absolute border-2 border-white/20 bg-white/5 rounded-full pointer-events-none transition-all duration-500 backdrop-blur-[1px] z-0"
                  style={{ 
                    left: `${((activeTower.x + 0.5) / 5) * 100}%`, 
                    top: `${((activeTower.y + 0.5) / 5) * 100}%`,
                    width: `${(activeTowerData.range * (1 + (activeTower.level - 1) * 0.2) * 2 / 5) * 100}%`,
                    height: `${(activeTowerData.range * (1 + (activeTower.level - 1) * 0.2) * 2 / 5) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="absolute inset-0 border border-white/10 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Tower Details / Upgrade Panel */}
            <div className="min-h-32 xs:min-h-44 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl xs:rounded-[2rem] p-4 xs:p-7 flex flex-col sm:flex-row items-center justify-between shadow-2xl relative overflow-hidden group gap-4 xs:gap-6">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
              {activeTower && activeTowerData ? (
                <div className="flex flex-col sm:flex-row w-full items-center justify-between gap-4 xs:gap-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 xs:gap-8 text-center sm:text-left">
                    <div className={`size-16 xs:size-24 rounded-2xl xs:rounded-3xl ${activeTowerData.color} flex items-center justify-center text-white text-3xl xs:text-5xl shadow-2xl relative group-hover:scale-105 transition-all duration-500 border-2 border-white/20 shrink-0`}>
                      <span className="material-symbols-outlined text-2xl xs:text-4xl">{activeTowerData.icon}</span>
                      <div className="absolute -bottom-1.5 xs:-bottom-3 -right-1.5 xs:-right-3 bg-white text-black text-[8px] xs:text-[11px] font-black px-1.5 xs:px-3 py-0.5 xs:py-1.5 rounded-md xs:rounded-xl shadow-xl border border-white/20">
                        RANK {activeTower.level}
                      </div>
                    </div>
                    <div className="space-y-1 xs:space-y-3">
                      <div>
                        <h4 className="text-lg xs:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{activeTowerData.name}</h4>
                        <p className="text-[8px] xs:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeTowerData.desc}</p>
                      </div>
                      <div className="flex justify-center sm:justify-start gap-2 xs:gap-5">
                        <div className="flex flex-col">
                          <span className="text-[7px] xs:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 xs:mb-1">Damage</span>
                          <div className="flex items-center gap-1 bg-red-500/10 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md xs:rounded-lg border border-red-500/20">
                            <span className="material-symbols-outlined text-[10px] xs:text-sm text-red-500">local_fire_department</span>
                            <span className="text-[9px] xs:text-xs font-black text-red-400">{(activeTowerData.damage * (1 + (activeTower.level-1) * 0.5)).toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7px] xs:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 xs:mb-1">Range</span>
                          <div className="flex items-center gap-1 bg-blue-500/10 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md xs:rounded-lg border border-blue-500/20">
                            <span className="material-symbols-outlined text-[10px] xs:text-sm text-blue-500">radar</span>
                            <span className="text-[9px] xs:text-xs font-black text-blue-400">{(activeTowerData.range * (1 + (activeTower.level-1) * 0.2)).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 xs:gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => {
                        const towerData = TOWERS.find(tower => tower.id === activeTower.id);
                        const cost = towerData ? towerData.upgradeCost * activeTower.level : 0;
                        if (td.tokens >= cost) {
                          socket.emit("td:upgrade", { code, towerIndex: activeTowerIndex });
                          setFeedback({ type: 'success', message: `${towerData?.name} Upgraded!` });
                        } else {
                          setFeedback({ type: 'error', message: 'Not enough tokens!' });
                        }
                      }}
                      disabled={td.tokens < activeTowerData.upgradeCost * activeTower.level}
                      className="group/btn relative bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:grayscale text-white px-6 xs:px-10 py-3 xs:py-5 rounded-xl xs:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] xs:text-xs transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 xs:gap-3 overflow-hidden flex-1 sm:flex-none"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                      <span className="material-symbols-outlined text-base xs:text-lg">upgrade</span>
                      <span>Enhance (${activeTowerData.upgradeCost * activeTower.level})</span>
                    </button>
                    <div className="flex items-center gap-1.5 xs:gap-2">
                      <div className="h-0.5 xs:h-1 w-6 xs:w-8 bg-primary/30 rounded-full"></div>
                      <span className="text-[8px] xs:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Next Rank: +50% Efficiency</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 xs:gap-4 w-full py-2 xs:py-4">
                  <div className="size-14 xs:size-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5 relative group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20"></div>
                    <span className="material-symbols-outlined text-2xl xs:text-4xl text-slate-600">
                      {status === "question" ? "sensors" : "touch_app"}
                    </span>
                  </div>
                  <div className="text-center space-y-0.5 xs:space-y-1">
                    <p className="text-[8px] xs:text-xs font-black text-slate-400 uppercase tracking-[0.4em]">
                      {status === "question" ? "SENSORS ACTIVE" : "SELECT UNIT FOR CALIBRATION"}
                    </p>
                    <p className="text-[7px] xs:text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      {status === "question" ? "Scanning for enemy signatures" : "Click a defensive unit to view diagnostics"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "restock" && (
          <div className="h-full flex flex-col justify-center max-w-2xl mx-auto w-full">
            {status === "question" && currentQ ? (
              <div className="space-y-6 xs:space-y-10 py-4 xs:py-8">
                <div className="text-center space-y-2 xs:space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 xs:px-4 py-1 xs:py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[8px] xs:text-[10px] font-black uppercase tracking-[0.3em]">
                    <span className="material-symbols-outlined text-xs xs:text-sm">psychology</span>
                    Data Node {qIndex + 1}
                  </div>
                  <h4 className="text-lg xs:text-2xl font-black text-white leading-tight tracking-tight">{currentQ.prompt}</h4>
                </div>
                
                <div className="grid grid-cols-1 gap-3 xs:gap-4">
                  {currentQ.choices.map((c: any, i: number) => (
                    <button
                      key={i}
                      disabled={selected !== null}
                      onClick={() => answer(i)}
                      className={`group/choice relative p-4 xs:p-6 rounded-xl xs:rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                        selected === i 
                          ? "bg-primary border-primary text-white shadow-2xl shadow-primary/40 scale-[1.02]" 
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-sm xs:text-lg font-bold">{c.text}</span>
                        <div className={`size-5 xs:size-6 rounded-md xs:rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                          selected === i ? "bg-white border-white text-primary" : "border-white/20"
                        }`}>
                          {selected === i && <span className="material-symbols-outlined text-[10px] xs:text-sm font-black">check</span>}
                        </div>
                      </div>
                      {/* Selection Shine */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover/choice:translate-x-full transition-transform duration-1000"></div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center gap-2 xs:gap-3 text-slate-500">
                    <div className="h-px w-8 xs:w-12 bg-white/10"></div>
                    <span className="text-[8px] xs:text-[10px] font-black uppercase tracking-[0.3em]">Neural Interface Synchronized</span>
                    <div className="h-px w-8 xs:w-12 bg-white/10"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 xs:space-y-8 py-8 xs:py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
                  <div className="relative size-24 xs:size-32 rounded-2xl xs:rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center mb-2 xs:mb-4">
                    <span className="material-symbols-outlined text-5xl xs:text-7xl text-slate-700">verified_user</span>
                    <div className="absolute top-0 right-0 size-6 xs:size-8 bg-primary rounded-xl xs:rounded-2xl border-4 border-slate-900 flex items-center justify-center">
                      <div className="size-1.5 xs:size-2 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 xs:space-y-3">
                  <h3 className="text-xl xs:text-2xl font-black text-white uppercase tracking-tight">Perimeter Secured</h3>
                  <p className="text-xs xs:text-sm text-slate-500 font-bold max-w-[200px] xs:max-w-xs mx-auto">Prepare for the next wave of data intrusion. Neural link re-establishing...</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-32 xs:w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 w-1/3 animate-[loading_2s_infinite]"></div>
                  </div>
                  <span className="text-[8px] xs:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Syncing Token Reserves</span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "shop" && (
          <div className="space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Tactical Arsenal</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deploy advanced defensive structures</p>
              </div>
              <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-sm">payments</span>
                <span className="text-sm font-black text-amber-500">{td.tokens} Credits</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {TOWERS.map((t) => (
                <button
                  key={t.id}
                  disabled={td.tokens < t.cost}
                  onClick={() => {
                    setSelectedTower(t.id);
                    setTab("defend");
                  }}
                  className={`group/tower relative flex items-center justify-between p-4 xs:p-6 rounded-2xl xs:rounded-3xl border-2 transition-all duration-500 overflow-hidden ${
                    selectedTower === t.id 
                      ? "border-primary bg-primary/15 backdrop-blur-2xl shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] scale-[1.03] z-10" 
                      : td.tokens >= t.cost 
                        ? "border-white/10 hover:border-white/30 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40" 
                        : "border-transparent bg-white/0 opacity-30 grayscale pointer-events-none"
                  }`}
                >
                  <div className="flex items-center gap-3 xs:gap-6 relative z-10">
                    <div className={`size-12 xs:size-20 rounded-xl xs:rounded-[1.5rem] ${t.color} flex items-center justify-center text-white shadow-2xl group-hover/tower:scale-110 group-hover/tower:rotate-3 transition-all duration-700 border border-white/30 shrink-0 relative`}>
                      <span className="material-symbols-outlined text-2xl xs:text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">{t.icon}</span>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover/tower:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="text-left space-y-0.5 xs:space-y-1.5">
                      <div className="font-black text-white uppercase tracking-tighter text-sm xs:text-xl group-hover/tower:text-primary transition-colors">{t.name}</div>
                      <div className="text-[10px] xs:text-[11px] font-bold text-slate-400 tracking-tight leading-snug max-w-[120px] xs:max-w-md line-clamp-2 group-hover/tower:text-slate-300 transition-colors">{t.desc}</div>
                      <div className="flex gap-2 xs:gap-4 pt-1">
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 group-hover/tower:border-red-500/20 transition-colors">
                          <span className="material-symbols-outlined text-[10px] xs:text-xs text-red-500">local_fire_department</span>
                          <span className="text-[9px] xs:text-[10px] font-black text-slate-500 group-hover/tower:text-red-400">{t.damage} DMG</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 group-hover/tower:border-blue-500/20 transition-colors">
                          <span className="material-symbols-outlined text-[10px] xs:text-xs text-blue-500">radar</span>
                          <span className="text-[9px] xs:text-[10px] font-black text-slate-500 group-hover/tower:text-blue-400">{t.range} RNG</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className={`px-4 xs:px-6 py-2 xs:py-3 rounded-xl xs:rounded-2xl font-black text-[10px] xs:text-base flex items-center gap-2 xs:gap-3 transition-all ${
                      td.tokens >= t.cost ? "bg-amber-500 text-black shadow-xl shadow-amber-500/30 group-hover/tower:scale-110 active:scale-95" : "bg-white/10 text-slate-500"
                    }`}>
                      <span className="material-symbols-outlined text-xs xs:text-xl">token</span>
                      {t.cost}
                    </div>
                  </div>

                  {/* Enhanced Tower Glow Effect */}
                  <div className={`absolute -right-12 -bottom-12 size-32 xs:size-48 blur-[50px] xs:blur-[80px] opacity-0 group-hover/tower:opacity-40 transition-all duration-1000 ${t.color.replace('bg-', 'bg-')}`}></div>
                  
                  {/* Interactive Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/tower:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                </button>
              ))}
            </div>
            
            <div className="mt-auto pt-6 border-t border-white/5 text-center">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">Global Defense Initiative • Version 2.0</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CafePlayerView({ cafe, players, code, socket, status, currentQ, qIndex, selected, answer }: CafePlayerViewProps) {
  const [tab, setTab] = useState<"serve" | "restock" | "shop">("serve");
  const [prepProgress, setPrepProgress] = useState(0);
  const [isPrepping, setIsPrepping] = useState(false);
  const [preppedItem, setPreppedItem] = useState<string | null>(null);
  const [prepQueue, setPrepQueue] = useState<string[]>([]);
  const [servingId, setServingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCooking, setIsCooking] = useState(false);

  // Add custom styles for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes progress-stripe {
        from { background-position: 0 0; }
        to { background-position: 40px 0; }
      }
      @keyframes loading {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0); }
        100% { transform: translateX(100%); }
      }
      .animate-spin-slow {
        animation: spin 3s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Effect to handle food preparation queue
  React.useEffect(() => {
    if (prepQueue.length > 0 && !isPrepping) {
      const nextItem = prepQueue[0];
      setPreppedItem(nextItem);
      setIsPrepping(true);
      setPrepProgress(0);
      
      const duration = cafe.upgrades.faster_prep ? 800 : 1500;
      const interval = 30; // Faster interval for smoother animation
      const steps = duration / interval;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = (currentStep / steps) * 100;
        setPrepProgress(progress);
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setIsPrepping(false);
          setPreppedItem(null);
          setPrepQueue(prev => prev.slice(1));
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [prepQueue, isPrepping, cafe.upgrades.faster_prep]);

  // Effect to handle "isCooking" state for restock feedback
  React.useEffect(() => {
    if (selected !== null && status === "question") {
      setIsCooking(true);
      const timer = setTimeout(() => setIsCooking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [selected, status]);

  // Effect to simulate food preparation when stock increases
  const prevStock = React.useRef(cafe.stock);
  React.useEffect(() => {
    const itemsIncreased: string[] = [];
    Object.keys(cafe.stock).forEach(key => {
      if ((cafe.stock[key] || 0) > (prevStock.current[key] || 0)) {
        itemsIncreased.push(key);
      }
    });

    if (itemsIncreased.length > 0) {
      setPrepQueue(prev => [...prev, ...itemsIncreased]);
    }
    prevStock.current = cafe.stock;
  }, [cafe.stock]);

  // Effect to handle serving feedback and reset servingId
  React.useEffect(() => {
    if (servingId) {
      const timer = setTimeout(() => {
        setServingId(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [servingId]);

  // Effect to clear feedback
  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);
  
  const FOOD_ITEMS = [
    { id: "toast", name: "Toast", icon: "toast", price: 5, color: "bg-orange-500", emoji: "🍞" },
    { id: "yogurt", name: "Yogurt", icon: "ice_cream", price: 10, color: "bg-blue-400", emoji: "🍦" },
    { id: "apple", name: "Apple", icon: "nutrition", price: 15, color: "bg-red-500", emoji: "🍎" },
    { id: "breakfast_bowl", name: "Breakfast Bowl", icon: "breakfast_dining", price: 30, color: "bg-purple-500", emoji: "🥣" },
  ];

  const UPGRADES = [
    { id: "multiplier", name: "Profit Multiplier", icon: "trending_up", cost: 100, desc: "Earn more per dish" },
    { id: "unlock_yogurt", name: "Unlock Yogurt", icon: "add_shopping_cart", cost: 50, desc: "Better profits" },
    { id: "unlock_apple", name: "Unlock Apple", icon: "add_shopping_cart", cost: 150, desc: "Premium dish" },
    { id: "unlock_breakfast_bowl", name: "Unlock Bowl", icon: "star", cost: 300, desc: "Masterpiece dish" },
    { id: "faster_prep", name: "Fast Kitchen", icon: "bolt", cost: 200, desc: "Restock faster" },
  ];

  return (
    <div className="flex flex-col h-full space-y-8 relative pb-10">
      {/* Global Feedback Overlay */}
      {feedback && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-10 py-5 rounded-[2rem] shadow-2xl animate-in fade-in zoom-in slide-in-from-top-12 duration-500 border backdrop-blur-xl ${
          feedback.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-4 font-black uppercase tracking-[0.2em] text-xs">
            <span className="material-symbols-outlined text-xl">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {feedback.message}
          </div>
        </div>
      )}

      {/* High-End Stats Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group gap-6 lg:gap-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 relative z-10 w-full lg:w-auto">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Total Capital</span>
            <div className="flex items-center gap-3">
              <div className="size-9 sm:size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500">payments</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tighter">${cafe.money.toLocaleString()}</span>
            </div>
          </div>
          <div className="hidden sm:block h-12 w-[1px] bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Answer Streak</span>
            <div className="flex items-center gap-3">
              <div className="size-9 sm:size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">local_fire_department</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tighter">{players[socket.id]?.streak || 0}</span>
            </div>
          </div>
          {cafe.upgrades.multiplier > 1 && (
            <>
              <div className="hidden sm:block h-12 w-[1px] bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Profit Boost</span>
                <div className="flex items-center gap-3">
                  <div className="size-9 sm:size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500">trending_up</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums tracking-tighter">{cafe.upgrades.multiplier}x</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5 relative z-10">
          <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] lg:mb-2">Business Impact</span>
          <div className="flex items-center gap-3 sm:gap-4 bg-white/5 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-white/5">
            <span className="material-symbols-outlined text-primary text-lg sm:text-xl">groups</span>
            <span className="text-base sm:text-lg font-black text-slate-200 tracking-tight">{cafe.customersServed} Served</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 p-2 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
        {(["serve", "restock", "shop"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all relative overflow-hidden group flex items-center justify-center gap-3 ${
              tab === t 
                ? "bg-primary text-white shadow-2xl shadow-primary/20 scale-[1.02]" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {t === 'serve' ? 'restaurant' : t === 'restock' ? 'inventory_2' : 'storefront'}
            </span>
            {t}
            {tab === t && (
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50"></div>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-[3rem] p-10 overflow-y-auto custom-scrollbar relative">
        {tab === "serve" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Prep Section */}
            <div className="bg-white/[0.04] p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Production Line</span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Active Preparation</h3>
                </div>
                <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                  <span className="material-symbols-outlined text-primary text-xl">timer</span>
                  <span className="text-sm font-black text-slate-200 tabular-nums">
                    {isPrepping ? `Ready in ${((100 - prepProgress) / 20).toFixed(1)}s` : 'System Idle'}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="relative w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/80 transition-all duration-150 ease-linear shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] relative ${isPrepping ? 'animate-pulse' : ''}`}
                  style={{ width: `${isPrepping ? prepProgress : 0}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[progress-stripe_1s_linear_infinite]"></div>
                </div>
              </div>

              {/* Queue Preview */}
              {prepQueue.length > 1 && (
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-500 text-sm">reorder</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next in Queue:</span>
                  </div>
                  <div className="flex gap-3">
                    {prepQueue.slice(1, 4).map((id, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-sm hover:border-primary/30 transition-colors">
                        <span className="text-xl filter drop-shadow-sm">{FOOD_ITEMS.find(f => f.id === id)?.emoji}</span>
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-tighter">{FOOD_ITEMS.find(f => f.id === id)?.name}</span>
                      </div>
                    ))}
                    {prepQueue.length > 4 && (
                      <div className="flex items-center justify-center px-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        +{prepQueue.length - 4} More
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-xl gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Inventory Management</span>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Current Stockpiles</h3>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-5">
                {FOOD_ITEMS.map(f => (
                  <div key={f.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-[2rem] bg-white/5 border border-white/10 group hover:border-primary/40 transition-all hover:bg-white/[0.08] relative overflow-hidden flex-1 sm:flex-none min-w-[100px] sm:min-w-0">
                    <div className="absolute bottom-0 left-0 h-[3px] bg-primary/40 transition-all duration-700 ease-out" style={{ width: `${Math.min((cafe.stock[f.id] || 0) * 10, 100)}%` }}></div>
                    <span className="text-2xl sm:text-3xl group-hover:scale-125 transition-transform duration-500 filter drop-shadow-md">{f.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Stock</span>
                      <span className={`text-base sm:text-lg font-black leading-none tabular-nums ${cafe.stock[f.id] > 0 ? 'text-white' : 'text-white/20'}`}>{cafe.stock[f.id] || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8">
              {cafe.customers && cafe.customers.length > 0 ? (
                cafe.customers.map((c: any) => {
                  const item = FOOD_ITEMS.find(f => f.id === c.item);
                  const hasStock = (cafe.stock[c.item] || 0) > 0;
                  const patienceColor = c.patience > 60 ? 'text-emerald-400' : c.patience > 30 ? 'text-amber-400' : 'text-rose-400';
                  const statusText = c.patience > 80 ? 'Excited' : c.patience > 50 ? 'Waiting' : c.patience > 20 ? 'Hungry' : 'Angry';
                  
                  const isServing = servingId === c.id;
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`flex flex-col sm:flex-row items-center justify-between p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] border transition-all duration-700 relative overflow-hidden group gap-6 sm:gap-12 ${
                        isServing ? "scale-[0.98] border-primary/50 bg-primary/10" :
                        hasStock ? "bg-white/[0.04] border-white/10 hover:border-primary/50 shadow-2xl backdrop-blur-sm" : "bg-white/0 border-transparent opacity-60"
                      } ${c.patience < 20 ? 'animate-shake border-rose-500/50' : ''}`}
                    >
                      {/* Serving Animation Overlay */}
                      {isServing && (
                        <div className="absolute inset-0 z-20 bg-primary/20 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in duration-500">
                          <div className="flex flex-col items-center gap-4">
                            <div className="size-16 sm:size-20 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                              <span className="material-symbols-outlined text-3xl sm:text-4xl text-white">delivery_dining</span>
                            </div>
                            <span className="text-[10px] sm:text-sm font-black text-white uppercase tracking-[0.4em]">Delivering...</span>
                          </div>
                        </div>
                      )}

                      {/* Low Patience Alert */}
                      {c.patience < 30 && (
                        <div className="absolute inset-0 bg-rose-500/5 pointer-events-none animate-pulse"></div>
                      )}
                      
                      {/* Patience Background Fill */}
                      <div 
                        className={`absolute inset-0 opacity-[0.03] transition-all duration-1000 ease-out ${
                          c.patience > 60 ? 'bg-emerald-500' : c.patience > 30 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${c.patience}%` }}
                      ></div>

                      {/* Patience Bar Top */}
                      <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-white/5">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--patience-rgb),0.5)] ${
                            c.patience > 60 ? 'bg-emerald-500' : c.patience > 30 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${c.patience}%` }}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 relative z-10 w-full sm:w-auto">
                        <div className="size-24 sm:size-32 rounded-[2rem] sm:rounded-[3rem] bg-white/5 flex items-center justify-center text-5xl sm:text-7xl shadow-inner relative group-hover:scale-110 transition-transform duration-500 border border-white/10 backdrop-blur-xl">
                          <span className="filter drop-shadow-2xl">{statusText === 'Angry' ? '😡' : statusText === 'Hungry' ? '😋' : '👤'}</span>
                          {c.patience > 90 && (
                            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-primary text-white text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl animate-bounce shadow-xl shadow-primary/30 border border-white/20">
                              NEW ARRIVAL
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 sm:space-y-5 text-center sm:text-left w-full sm:w-auto">
                          <div className={`text-[9px] sm:text-xs font-black uppercase tracking-[0.3em] ${patienceColor} flex items-center justify-center sm:justify-start gap-2 sm:gap-3`}>
                            <span className="size-2 sm:size-2.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]"></span>
                            {statusText}
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-5 bg-white/5 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[2.5rem] border border-white/5 shadow-sm group-hover:border-primary/20 transition-colors">
                            <span className="text-3xl sm:text-5xl filter drop-shadow-md group-hover:rotate-12 transition-transform">{item?.emoji}</span>
                            <span className="text-2xl sm:text-4xl font-black text-white tracking-tighter">{item?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-6 sm:gap-8 relative z-10 w-full sm:w-auto pt-6 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Est. Revenue</span>
                          <div className="text-3xl sm:text-5xl font-black text-amber-500 drop-shadow-lg tabular-nums tracking-tighter">
                            +${(item?.price || 0) * (cafe.upgrades.multiplier || 1)}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setServingId(c.id);
                            socket.emit("cafe:serve", { code, customerId: c.id });
                            setFeedback({ type: 'success', message: `Served ${item?.name}!` });
                          }}
                          disabled={!hasStock || isServing}
                          className={`flex-1 sm:flex-none px-8 sm:px-14 py-4 sm:py-6 rounded-2xl sm:rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs transition-all active:scale-95 flex items-center justify-center gap-3 sm:gap-4 shadow-2xl ${
                            hasStock 
                              ? "bg-primary text-white hover:brightness-110 hover:shadow-primary/40" 
                              : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
                          }`}
                        >
                          {isServing ? (
                            <>
                              <span className="material-symbols-outlined text-xl animate-spin">sync</span>
                              Serving...
                            </>
                          ) : hasStock ? (
                            <>
                              <span className="material-symbols-outlined text-xl">restaurant</span>
                              Deliver Order
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-xl">hourglass_empty</span>
                              No Stock
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-32 space-y-8 bg-white/[0.02] rounded-[4rem] border-2 border-dashed border-white/5 flex flex-col items-center animate-in fade-in duration-1000">
                  <div className="size-32 bg-white/5 rounded-full flex items-center justify-center animate-pulse border border-white/5">
                    <span className="material-symbols-outlined text-7xl text-slate-800">shopping_basket</span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-slate-400 font-black text-2xl uppercase tracking-widest">The Lobby is Empty</p>
                    <p className="text-xs text-slate-600 uppercase tracking-[0.4em] font-bold max-w-sm mx-auto leading-loose">Waiting for prospective patrons to discover your culinary excellence</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "restock" && (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700">
            {isCooking ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 xs:space-y-10 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <div className="size-40 xs:size-56 rounded-[3rem] xs:rounded-[4rem] bg-primary/10 flex items-center justify-center animate-pulse border border-primary/20">
                    <span className="material-symbols-outlined text-6xl xs:text-[100px] text-primary animate-bounce">restaurant</span>
                  </div>
                  <div className="absolute -top-4 xs:-top-6 -right-4 xs:-right-6 size-14 xs:size-20 bg-amber-500 rounded-2xl xs:rounded-3xl flex items-center justify-center text-white shadow-2xl animate-spin-slow border-2 xs:border-4 border-slate-900">
                    <span className="material-symbols-outlined text-2xl xs:text-4xl">flare</span>
                  </div>
                </div>
                <div className="text-center space-y-4 xs:space-y-6">
                  <h3 className="text-2xl xs:text-4xl font-black text-white uppercase tracking-[0.2em] xs:tracking-[0.3em]">Cooking...</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-[0.3em] xs:tracking-[0.4em] text-[10px] xs:text-sm">Preparing fresh ingredients</p>
                </div>
                <div className="w-64 xs:w-80 h-2 xs:h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div className="h-full bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite] shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"></div>
                </div>
              </div>
            ) : status === "question" && currentQ ? (
              <div className="space-y-6 xs:space-y-12 py-6 xs:py-10">
                <div className="flex justify-between items-center bg-white/[0.04] backdrop-blur-xl p-5 xs:p-8 rounded-[1.5rem] xs:rounded-[2.5rem] border border-white/10 shadow-xl">
                  <div className="flex flex-col">
                    <span className="text-[8px] xs:text-[10px] font-black text-primary uppercase tracking-[0.3em] xs:tracking-[0.4em] mb-1 xs:mb-2">Restock Phase</span>
                    <h3 className="text-lg xs:text-xl font-black text-white uppercase tracking-tight">Challenge {qIndex + 1}</h3>
                  </div>
                  <div className="size-12 xs:size-16 rounded-xl xs:rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                    <span className="material-symbols-outlined text-2xl xs:text-3xl">quiz</span>
                  </div>
                </div>

                <div className="bg-white/[0.03] p-6 xs:p-12 rounded-[2rem] xs:rounded-[4rem] border border-white/10 shadow-2xl space-y-8 xs:space-y-12 relative overflow-hidden group/card">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000"></div>
                  <h4 className="text-xl xs:text-3xl font-black text-white leading-[1.3] text-center max-w-3xl mx-auto relative z-10 tracking-tight group-hover/card:scale-[1.02] transition-transform duration-500">{currentQ.prompt}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6 relative z-10">
                    {currentQ.choices.map((c: any, i: number) => (
                      <button
                        key={i}
                        disabled={selected !== null}
                        onClick={() => answer(i)}
                        style={{ transitionDelay: `${i * 50}ms` }}
                        className={`group p-5 xs:p-8 rounded-[1.5rem] xs:rounded-[2.5rem] border-2 transition-all duration-500 text-left relative overflow-hidden flex items-center gap-4 xs:gap-6 animate-in fade-in slide-in-from-bottom-4 ${
                          selected === i 
                            ? "bg-primary border-primary text-white scale-[0.98] shadow-2xl shadow-primary/40" 
                            : "bg-white/5 border-white/10 text-slate-300 hover:border-primary/50 hover:bg-white/[0.08] hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                        }`}
                      >
                        <div className={`size-10 xs:size-12 rounded-xl xs:rounded-2xl flex items-center justify-center font-black text-lg xs:text-xl transition-all duration-700 ${
                          selected === i ? "bg-white text-primary rotate-[360deg] shadow-[0_0_20px_rgba(255,255,255,0.5)]" : "bg-white/10 text-slate-500 group-hover:bg-primary/20 group-hover:text-primary group-hover:rotate-12"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="font-bold text-lg xs:text-xl tracking-tight flex-1 group-hover:translate-x-1 transition-transform duration-500">{c.text}</span>
                        {selected === i && (
                          <div className="absolute right-5 xs:right-8 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl xs:text-2xl animate-ping absolute">radio_button_checked</span>
                            <span className="material-symbols-outlined text-xl xs:text-2xl">verified</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        {/* Interactive Sparkle Effect on Hover */}
                        <div className="absolute -top-10 -right-10 size-20 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 xs:space-y-10 py-16 xs:py-32">
                <div className="size-28 xs:size-40 bg-white/5 rounded-[2.5rem] xs:rounded-[3.5rem] flex items-center justify-center animate-pulse border border-white/10 shadow-inner">
                  <span className="material-symbols-outlined text-5xl xs:text-[80px] text-slate-800">hourglass_top</span>
                </div>
                <div className="text-center space-y-3 xs:space-y-4 px-4">
                  <p className="text-slate-400 font-black text-xl xs:text-2xl uppercase tracking-[0.2em] xs:tracking-[0.3em]">Wait for Orders</p>
                  <p className="text-[10px] xs:text-xs text-slate-600 uppercase tracking-[0.3em] xs:tracking-[0.4em] font-bold max-w-sm mx-auto leading-relaxed">The host is preparing the next set of culinary challenges. Be ready!</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "shop" && (
          <div className="space-y-6 xs:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col xs:flex-row justify-between items-center bg-white/[0.04] p-6 xs:p-8 rounded-[1.5rem] xs:rounded-[2.5rem] border border-white/10 shadow-xl gap-4 xs:gap-0">
              <div className="flex flex-col items-center xs:items-start">
                <span className="text-[8px] xs:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] xs:tracking-[0.4em] mb-1 xs:mb-2">Enterprise Growth</span>
                <h3 className="text-lg xs:text-xl font-black text-white uppercase tracking-tight">Franchise Upgrades</h3>
              </div>
              <div className="flex items-center gap-3 xs:gap-4 bg-amber-500/10 px-5 xs:px-6 py-3 xs:py-4 rounded-xl xs:rounded-2xl border border-amber-500/20 shadow-inner w-full xs:w-auto justify-center">
                <span className="material-symbols-outlined text-amber-500 text-xl xs:text-2xl">payments</span>
                <div className="flex flex-col items-center xs:items-end">
                  <span className="text-[8px] xs:text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Available Capital</span>
                  <span className="text-xl xs:text-2xl font-black text-amber-500 tabular-nums">${cafe.money.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xs:gap-6 pb-10">
              {UPGRADES.map((u) => {
                const isPurchased = (u.id.startsWith('unlock_') && cafe.stock[u.id.replace('unlock_', '')] !== undefined) || (u.id === 'faster_prep' && cafe.upgrades.faster_prep);
                const canAfford = cafe.money >= u.cost;

                return (
                  <button
                    key={u.id}
                    disabled={cafe.money < u.cost || isPurchased}
                    onClick={() => {
                      if (cafe.money >= u.cost) {
                        socket.emit("cafe:upgrade", { code, upgradeId: u.id });
                        setFeedback({ type: 'success', message: `Purchased ${u.name}!` });
                      } else {
                        setFeedback({ type: 'error', message: 'Insufficient funds!' });
                      }
                    }}
                    className={`flex flex-col xs:flex-row items-center justify-between p-6 xs:p-8 rounded-[2rem] xs:rounded-[3rem] border-2 transition-all duration-500 group relative overflow-hidden gap-6 xs:gap-0 ${
                      isPurchased 
                        ? "border-emerald-500/30 bg-emerald-500/5 cursor-default" 
                        : canAfford 
                          ? "border-white/10 hover:border-amber-500/50 bg-white/[0.04] shadow-2xl hover:bg-white/[0.08] hover:scale-[1.01]" 
                          : "border-transparent bg-white/0 opacity-40 grayscale pointer-events-none"
                    }`}
                  >
                    {isPurchased && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] xs:text-[9px] font-black px-4 xs:px-5 py-1.5 xs:py-2 rounded-bl-xl xs:rounded-bl-[1.5rem] uppercase tracking-[0.2em] shadow-lg">
                        System Active
                      </div>
                    )}
                    <div className="flex flex-col xs:flex-row items-center gap-4 xs:gap-8 text-center xs:text-left">
                      <div className={`size-16 xs:size-20 rounded-2xl xs:rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-inner border shrink-0 ${
                        isPurchased ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:rotate-12'
                      }`}>
                        <span className="material-symbols-outlined text-3xl xs:text-[40px]">{u.icon}</span>
                      </div>
                      <div className="space-y-1 xs:space-y-2">
                        <div className="font-black text-white text-xl xs:text-2xl tracking-tight uppercase">{u.name}</div>
                        <div className="text-[10px] xs:text-xs text-slate-500 max-w-[320px] leading-relaxed font-medium">{u.desc}</div>
                      </div>
                    </div>
                    {!isPurchased && (
                      <div className={`w-full xs:w-auto px-6 xs:px-8 py-3 xs:py-4 rounded-xl xs:rounded-[1.5rem] font-black text-base xs:text-lg transition-all shadow-2xl flex items-center justify-center gap-2 xs:gap-3 ${
                        canAfford ? 'bg-amber-500 text-black shadow-amber-500/20 group-hover:scale-105' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <span className="text-xs xs:text-sm font-black opacity-60">$</span>
                        {u.cost.toLocaleString()}
                      </div>
                    )}
                    {isPurchased && (
                      <div className="size-10 xs:size-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <span className="material-symbols-outlined text-xl xs:text-2xl">check_circle</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState<View>("home");
  
  // Economy & Inventory
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem("qs_coins");
    return saved ? parseInt(saved) : 0;
  });

  const [inventory, setInventory] = useState<string[]>(() => {
    const saved = localStorage.getItem("qs_inventory");
    return saved ? JSON.parse(saved) : ["default"];
  });

  const [powerUpInventory, setPowerUpInventory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("qs_powerups");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedSphereId, setSelectedSphereId] = useState<string>(() => {
    return localStorage.getItem("qs_selected_sphere") || "default";
  });

  const [modMenuUnlocked, setModMenuUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("qs_mod_menu") === "true";
  });

  const addCoins = (amount: number) => {
    const newCoins = coins + amount;
    setCoins(newCoins);
    localStorage.setItem("qs_coins", newCoins.toString());
  };

  const buyItem = (sphere: Sphere) => {
    if (coins >= sphere.cost && !inventory.includes(sphere.id)) {
      const newCoins = coins - sphere.cost;
      const newInventory = [...inventory, sphere.id];
      
      setCoins(newCoins);
      setInventory(newInventory);
      
      localStorage.setItem("qs_coins", newCoins.toString());
      localStorage.setItem("qs_inventory", JSON.stringify(newInventory));
      
      if (sphere.rarity === "Glitch") {
        setModMenuUnlocked(true);
        localStorage.setItem("qs_mod_menu", "true");
      }
      return true;
    }
    return false;
  };

  const buyPowerUp = (powerUp: PowerUp) => {
    if (coins >= powerUp.cost) {
      const newCoins = coins - powerUp.cost;
      setCoins(newCoins);
      localStorage.setItem("qs_coins", newCoins.toString());
      
      const newPowerUps = { ...powerUpInventory };
      newPowerUps[powerUp.id] = (newPowerUps[powerUp.id] || 0) + 1;
      setPowerUpInventory(newPowerUps);
      localStorage.setItem("qs_powerups", JSON.stringify(newPowerUps));
      return true;
    }
    return false;
  };

  const selectSphere = (id: string) => {
    setSelectedSphereId(id);
    localStorage.setItem("qs_selected_sphere", id);
  };

  const showMainHeader = view === "home" || view === "features" || view === "about" || view === "market";
  
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white transition-colors duration-300 min-h-screen overflow-x-hidden overflow-y-auto custom-scrollbar">
      {showMainHeader && <Header setView={setView} coins={coins} />}
      <main className={showMainHeader ? "pt-20" : ""}>
        {view === "home" && <Home onStartHost={() => setView("host")} onStartPlayer={() => setView("player")} />}
        {view === "host" && (
          <div className="pt-24 px-6 max-w-7xl mx-auto">
            <Host />
          </div>
        )}
        {view === "player" && (
          <Player 
            setHomeView={() => setView("home")} 
            selectedSphereId={selectedSphereId}
            modMenuUnlocked={modMenuUnlocked}
            addCoins={addCoins}
            powerUpInventory={powerUpInventory}
            setPowerUpInventory={setPowerUpInventory}
          />
        )}
        {view === "market" && (
          <Market 
            coins={coins} 
            inventory={inventory} 
            buyItem={buyItem} 
            buyPowerUp={buyPowerUp}
            selectSphere={selectSphere}
            selectedSphereId={selectedSphereId}
          />
        )}
        {view === "features" && <FeaturesPage />}
        {view === "about" && <AboutPage />}
      </main>
    </div>
  );
}

function Header({ setView, coins }: { setView: (v: View) => void, coins: number }) {
  return (
    <header className="fixed top-0 w-full z-50 glass-nav border-b border-border-custom/30">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("home")}>
          <div className="text-primary">
            <span className="material-symbols-outlined text-4xl">school</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">QuizSphere</h2>
        </div>
        <NavBar setView={setView} coins={coins} />
      </div>
    </header>
  );
}

function NavBar({ setView, coins }: { setView: (v: View) => void, coins: number }) {
  const scrollToPricing = () => {
    setView("home");
    setTimeout(() => {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="flex items-center gap-10">
      <nav className="hidden md:flex items-center gap-8">
        <button onClick={() => setView("features")} className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]">Features</button>
        <button onClick={() => setView("market")} className="group flex items-center gap-2 text-[10px] font-black text-primary hover:text-primary transition-colors uppercase tracking-[0.2em]">
          <span className="material-symbols-outlined text-lg">storefront</span>
          Market
        </button>
        <button onClick={scrollToPricing} className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]">Pricing</button>
        <button onClick={() => setView("about")} className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]">About</button>
      </nav>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl shadow-inner">
          <span className="material-symbols-outlined text-amber-500 text-xl">monetization_on</span>
          <span className="text-sm font-black text-white tabular-nums">{coins.toLocaleString()}</span>
        </div>
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        <button className="px-6 py-2.5 text-[10px] font-black bg-primary text-white rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest">
          Sign In
        </button>
      </div>
    </div>
  );
}

function FeaturesPage() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-[0.2em] uppercase">
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          Platform Capabilities
        </div>
        <h2 className="text-6xl font-black tracking-tight text-white">Next-Gen Education</h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
          QuizSphere is engineered for high-performance classrooms, providing a suite of professional tools for the modern educator.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureDetail icon="bolt" title="Ultra-Low Latency" description="Proprietary real-time synchronization engine ensures zero-lag interactions for all participants, regardless of scale." />
        <FeatureDetail icon="analytics" title="Advanced Telemetry" description="Deep pedagogical insights with real-time heatmaps, performance distribution, and growth tracking metrics." />
        <FeatureDetail icon="security" title="Security Protocols" description="Bank-grade encryption for session data and robust automated filtering systems for classroom safety." />
        <FeatureDetail icon="cloud_sync" title="Seamless Integration" description="Effortlessly import existing assessments via CSV and synchronize with major learning management systems." />
        <FeatureDetail icon="palette" title="Dynamic Customization" description="Personalize your teaching environment with high-fidelity visual themes and interactive game modes." />
        <FeatureDetail icon="group_work" title="Collaborative Learning" description="Multi-squad tactical modes and cooperative objectives designed to foster teamwork and critical thinking." />
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto min-h-screen">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-[3rem] shadow-2xl space-y-12">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="size-40 rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-6xl font-black shadow-2xl shadow-primary/30">
            D
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-5xl font-black tracking-tight text-white">DUB55</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              Lead Architect & Visionary
            </div>
          </div>
        </div>

        <div className="space-y-6 text-slate-300 text-lg font-light leading-relaxed">
          <p>
            QuizSphere was born from a singular vision: to bridge the gap between rigorous academic assessment and the engaging, high-fidelity experiences of modern technology.
          </p>
          <p>
            The lead developer, <span className="text-white font-bold">DUB55</span>, dedicated countless hours to architecting a platform that doesn't just test knowledge, but celebrates the learning journey itself. 
          </p>
          <p>
            Frustrated by the stagnant nature of traditional classroom tools, DUB55 set out to create a "gamified study experience" that treats students like the intelligent, tech-savvy individuals they are. Every line of code in QuizSphere is written with the goal of making education as thrilling as it is essential.
          </p>
          <p className="pt-8 italic border-t border-white/5 text-slate-500">
            "Education is the transmission of civilization. My mission is to ensure that transmission is as powerful and seamless as possible." — DUB55
          </p>
          {mode === "sprint" && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500 opacity-50"></div>
              <h3 className="text-sm font-black text-green-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined">speed</span>
                Sprint Velocity
              </h3>
              <div className="flex justify-between items-center">
                <div className="text-4xl font-black text-white">4:52</div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Remaining</div>
                  <div className="text-green-500 font-bold">Optimal Pace</div>
                </div>
              </div>
            </div>
          )}

          {mode === "team" && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 opacity-50"></div>
              <h3 className="text-sm font-black text-purple-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined">groups</span>
                Squad Synchronization
              </h3>
              <div className="space-y-4">
                {Object.entries(teamLeaderboard || {}).map(([team, score]) => (
                  <div key={team} className="flex justify-between items-center">
                    <span className="text-white font-bold">{team}</span>
                    <span className="text-primary font-black">{score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureDetail({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-500">
      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
      <p className="text-slate-400 font-light leading-relaxed">{description}</p>
    </div>
  );
}

function Home({ onStartHost, onStartPlayer }: { onStartHost: () => void; onStartPlayer: () => void }) {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden hero-pattern">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-[0.2em] uppercase mb-8">
            <span className="material-symbols-outlined text-sm">verified</span>
            The Gold Standard in Education
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 leading-[1.1] text-white">
            QuizSphere
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed mb-12">
            Elevate classroom engagement with the next generation of interactive learning. 
            Sophisticated tools designed for modern educators.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={onStartHost}
              className="group flex items-center gap-3 min-w-[220px] justify-center px-8 py-5 bg-primary text-white rounded-xl font-bold text-lg hover:translate-y-[-2px] transition-all shadow-xl shadow-primary/25"
            >
              <span className="material-symbols-outlined">play_circle</span>
              Host a Game
            </button>
            <button 
              onClick={onStartPlayer}
              className="group flex items-center gap-3 min-w-[220px] justify-center px-8 py-5 border border-border-custom bg-slate-custom/30 text-white rounded-xl font-bold text-lg hover:bg-slate-custom/50 transition-all"
            >
              <span className="material-symbols-outlined">group</span>
              Join a Game
            </button>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
              Premium Learning Experience
            </h2>
            <p className="text-slate-400 text-lg font-light leading-relaxed">
              Designed for educators who value both aesthetics and functionality. Every interaction is crafted to be seamless.
            </p>
          </div>
          <button onClick={() => setView("features")} className="text-primary font-bold flex items-center gap-2 cursor-pointer hover:gap-4 transition-all">
            View all features <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon="bar_chart" title="Real-time Analytics" description="Deep insights into student performance with elegant data visualizations and live heatmaps." />
          <FeatureCard icon="database" title="Customizable Banks" description="Create and share high-quality question sets with our intuitive builder and rich media support." />
          <FeatureCard icon="public" title="Global Access" description="Host sessions for students anywhere in the world with zero latency and multi-language support." />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-custom/5 border-y border-border-custom/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">Transparent Pricing</h2>
            <p className="text-slate-400 font-light">Choose the plan that fits your classroom or institution.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
              plan="Basic" 
              price="0" 
              features={["Unlimited Quizzes", "Up to 30 Players", "Standard Assets"]} 
            />
            <PricingCard 
              plan="Pro" 
              price="12" 
              recommended 
              features={["Unlimited Quizzes", "Up to 100 Players", "Premium Asset Library", "Advanced Analytics"]} 
            />
            <PricingCard 
              plan="Institution" 
              price="49" 
              features={["Unlimited Players", "SSO Integration", "Dedicated Support"]} 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-white">
            Ready to transform your classroom?
          </h2>
          <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto font-light">
            Join thousands of educators using QuizSphere for a more sophisticated learning experience.
          </p>
          <button 
            onClick={onStartHost}
            className="px-12 py-5 bg-primary text-white text-xl font-bold rounded-xl hover:scale-105 transition-all shadow-2xl shadow-primary/30"
          >
            Get Started for Free
          </button>
        </div>
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-primary/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-[50%] h-full bg-gradient-to-r from-primary/10 to-transparent"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border-custom/30 bg-background-dark">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">school</span>
            <span className="font-bold text-xl tracking-tight text-white">QuizSphere</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-400">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Back to Top</button>
            <button onClick={() => {
              const el = document.getElementById("pricing");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }} className="hover:text-white transition-colors">Pricing</button>
            <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
          </div>
          <p className="text-xs text-slate-500">© 2026 QuizSphere • Crafted by DUB55</p>
        </div>
      </footer>
    </>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group p-8 rounded-2xl border border-border-custom bg-slate-custom/10 hover:bg-slate-custom/20 transition-all">
      <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-slate-400 font-light leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ plan, price, features, recommended }: { plan: string; price: string; features: string[]; recommended?: boolean }) {
  return (
    <div className={`flex flex-col p-8 rounded-2xl border ${recommended ? "border-2 border-primary scale-105 shadow-2xl shadow-primary/10" : "border-border-custom"} bg-background-dark relative`}>
      {recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Recommended</div>
      )}
      <div className="mb-8">
        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">{plan}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-white">${price}</span>
          <span className="text-slate-400 text-sm">/month</span>
        </div>
      </div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
            <span className="material-symbols-outlined text-primary text-sm">check_circle</span> {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-4 rounded-xl ${recommended ? "bg-primary text-white" : "border border-border-custom text-white hover:bg-slate-custom"} font-bold transition-all shadow-lg ${recommended ? "shadow-primary/20" : ""}`}>
        {plan === "Institution" ? "Contact Sales" : "Get Started"}
      </button>
    </div>
  );
}

function Market({ coins, inventory, buyItem, buyPowerUp, selectSphere, selectedSphereId }: { 
  coins: number, 
  inventory: string[], 
  buyItem: (s: Sphere) => boolean, 
  buyPowerUp: (p: PowerUp) => boolean,
  selectSphere: (id: string) => void,
  selectedSphereId: string
}) {
  const [activeTab, setActiveTab] = useState<"Spheres" | "PowerUps">("Spheres");
  const [filter, setFilter] = useState<Rarity | "All">("All");
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Clear feedback after 2s
  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const filteredSpheres = filter === "All" ? SPHERES : SPHERES.filter(s => s.rarity === filter);
  const rarities: (Rarity | "All")[] = ["All", "Common", "Rare", "Epic", "Legendary", "Glitch"];

  return (
    <div className="pt-24 xs:pt-32 pb-16 xs:pb-24 px-4 xs:px-6 max-w-7xl mx-auto min-h-screen relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-64 xs:w-96 h-64 xs:h-96 bg-primary/5 rounded-full blur-[80px] xs:blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-72 xs:w-[30rem] h-72 xs:h-[30rem] bg-blue-500/5 rounded-full blur-[100px] xs:blur-[150px] pointer-events-none -z-10"></div>

      {/* Feedback Overlay */}
      {feedback && (
        <div className={`fixed top-16 xs:top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] xs:w-auto px-6 xs:px-8 py-3 xs:py-4 rounded-2xl xs:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in slide-in-from-top-8 duration-500 border-2 backdrop-blur-xl ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-3 xs:gap-4 font-black uppercase tracking-[0.15em] xs:tracking-[0.2em] text-[10px] xs:text-xs">
            <div className={`size-7 xs:size-8 rounded-full flex items-center justify-center shrink-0 ${feedback.type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
              <span className="material-symbols-outlined text-base xs:text-lg">
                {feedback.type === 'success' ? 'verified' : 'warning'}
              </span>
            </div>
            {feedback.message}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between mb-10 xs:mb-16 gap-8 lg:gap-10">
        <div className="space-y-4 xs:space-y-6 w-full lg:w-auto flex flex-col items-center lg:items-start">
          <div className="inline-flex items-center gap-2 xs:gap-3 px-4 xs:px-5 py-2 xs:py-2.5 rounded-full bg-white/5 border border-white/10 text-primary text-[8px] xs:text-[10px] font-black tracking-[0.2em] xs:tracking-[0.3em] uppercase backdrop-blur-md">
            <span className="material-symbols-outlined text-xs xs:text-sm animate-pulse">hub</span>
            Asset Acquisition Hub
          </div>
          <h2 className="text-4xl xs:text-6xl sm:text-7xl font-black tracking-tighter text-white text-center lg:text-left">Global Market</h2>
          <div className="flex gap-2 xs:gap-4 p-1 xs:p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl xs:rounded-2xl w-full xs:w-fit">
            <button 
              onClick={() => setActiveTab("Spheres")}
              className={`flex-1 xs:flex-none px-6 xs:px-10 py-2.5 xs:py-3.5 rounded-lg xs:rounded-xl text-[8px] xs:text-[10px] font-black uppercase tracking-[0.15em] xs:tracking-[0.2em] transition-all duration-500 ${
                activeTab === "Spheres" 
                  ? "bg-primary text-white shadow-2xl shadow-primary/20 scale-105" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Spheres
            </button>
            <button 
              onClick={() => setActiveTab("PowerUps")}
              className={`flex-1 xs:flex-none px-6 xs:px-10 py-2.5 xs:py-3.5 rounded-lg xs:rounded-xl text-[8px] xs:text-[10px] font-black uppercase tracking-[0.15em] xs:tracking-[0.2em] transition-all duration-500 ${
                activeTab === "PowerUps" 
                  ? "bg-primary text-white shadow-2xl shadow-primary/20 scale-105" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Tactical Gear
            </button>
          </div>
        </div>

        {activeTab === "Spheres" && (
          <div className="flex flex-wrap justify-center gap-2 p-2 bg-white/5 backdrop-blur-xl rounded-2xl xs:rounded-[2rem] border border-white/10 shadow-2xl w-full xs:w-auto">
            {rarities.map(r => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`px-3 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-[8px] xs:text-[9px] font-black uppercase tracking-[0.15em] xs:tracking-[0.2em] transition-all duration-500 border-2 ${
                  filter === r 
                    ? "bg-white border-white text-primary shadow-xl scale-105" 
                    : "bg-transparent border-transparent text-slate-400 hover:text-white hover:border-white/10"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "Spheres" ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 xs:gap-8">
          {filteredSpheres.map((sphere, idx) => {
            const isOwned = inventory.includes(sphere.id);
            const isSelected = selectedSphereId === sphere.id;
            const canAfford = coins >= sphere.cost;

            return (
              <div 
                key={sphere.id}
                style={{ animationDelay: `${idx * 50}ms` }}
                className={`group relative p-6 xs:p-10 rounded-[2rem] xs:rounded-[4rem] border-2 transition-all duration-700 overflow-hidden flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-12 ${
                  isSelected 
                    ? "bg-primary/10 border-primary/40 shadow-[0_30px_60px_rgba(var(--primary-rgb),0.15)] backdrop-blur-xl" 
                    : isOwned
                      ? "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/[0.08] backdrop-blur-sm"
                      : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/5 backdrop-blur-[2px]"
                }`}
              >
                {/* Rarity Glow */}
                <div className={`absolute -top-12 xs:-top-20 -right-12 xs:-right-20 w-24 xs:w-40 h-24 xs:h-40 blur-[40px] xs:blur-[60px] opacity-20 transition-opacity duration-700 group-hover:opacity-40 ${
                  sphere.rarity === "Common" ? "bg-slate-500" :
                  sphere.rarity === "Rare" ? "bg-blue-500" :
                  sphere.rarity === "Epic" ? "bg-purple-500" :
                  sphere.rarity === "Legendary" ? "bg-amber-500" :
                  "bg-rose-500 animate-pulse"
                }`}></div>

                {/* Rarity Tag */}
                <div className={`absolute top-4 xs:top-8 right-4 xs:right-8 px-2.5 xs:px-4 py-1 xs:py-1.5 rounded-full text-[6px] xs:text-[8px] font-black uppercase tracking-[0.15em] xs:tracking-[0.2em] border-2 backdrop-blur-md z-10 ${
                  sphere.rarity === "Common" ? "bg-slate-500/10 border-slate-500/20 text-slate-400" :
                  sphere.rarity === "Rare" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                  sphere.rarity === "Epic" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                  sphere.rarity === "Legendary" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                  "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse"
                }`}>
                  {sphere.rarity}
                </div>

                <div className="relative mt-4 xs:mt-6">
                  {/* Decorative Ring */}
                  <div className={`absolute inset-[-1rem] xs:inset-[-1.5rem] rounded-full border border-white/5 transition-transform duration-1000 group-hover:rotate-180 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 xs:size-2 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),1)]"></div>
                  </div>

                  <div className={`size-20 xs:size-36 rounded-[1.5rem] xs:rounded-[3.5rem] flex items-center justify-center text-4xl xs:text-8xl transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12 ${
                    sphere.rarity === "Glitch" 
                      ? "bg-rose-500/10 shadow-[0_0_50px_rgba(244,63,94,0.3)] border border-rose-500/20" 
                      : "bg-white/5 border border-white/10"
                  }`}>
                    {sphere.emoji}
                  </div>
                  {isOwned && !isSelected && (
                    <div className="absolute -bottom-1 xs:-bottom-2 -right-1 xs:-right-2 size-6 xs:size-10 bg-emerald-500 text-white rounded-lg xs:rounded-2xl flex items-center justify-center shadow-2xl border-2 xs:border-4 border-background-dark animate-in zoom-in duration-500">
                      <span className="material-symbols-outlined text-xs xs:text-lg font-black">done_all</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 xs:mt-10 space-y-1 xs:space-y-3 w-full relative z-10">
                  <h3 className="text-xl xs:text-3xl font-black text-white tracking-tighter group-hover:translate-y-[-2px] transition-transform truncate px-1">{sphere.name}</h3>
                  <div className="flex items-center justify-center gap-1 xs:gap-2">
                    {isOwned ? (
                      <div className="px-2 xs:px-4 py-0.5 xs:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[7px] xs:text-[9px] font-black uppercase tracking-[0.2em] xs:tracking-[0.3em] text-emerald-400">Vaulted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 xs:gap-2 px-2 xs:px-4 py-1 xs:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                        <span className="material-symbols-outlined text-xs xs:text-sm text-amber-500">monetization_on</span>
                        <span className="text-xs xs:text-base font-black text-amber-500 tabular-nums">{sphere.cost.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 xs:mt-10 w-full pt-6 xs:pt-8 border-t border-white/10 relative z-10">
                  {isOwned ? (
                    <button
                      onClick={() => {
                        selectSphere(sphere.id);
                        setFeedback({ type: 'success', message: `Equipped ${sphere.name}!` });
                      }}
                      className={`w-full py-3 xs:py-5 rounded-xl xs:rounded-[2rem] text-[8px] xs:text-[10px] font-black uppercase tracking-[0.2em] xs:tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-2 xs:gap-3 overflow-hidden relative group/btn ${
                        isSelected 
                          ? "bg-white text-primary shadow-[0_20px_40px_rgba(255,255,255,0.1)] scale-105" 
                          : "bg-white/5 text-white hover:bg-white/10 border-2 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base xs:text-lg">{isSelected ? "verified" : "radio_button_checked"}</span>
                      {isSelected ? "Active" : "Select"}
                      {isSelected && <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (buyItem(sphere)) {
                          setFeedback({ type: 'success', message: `Purchased ${sphere.name}!` });
                        } else {
                          setFeedback({ type: 'error', message: 'Insufficient coins!' });
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full py-3 xs:py-5 rounded-xl xs:rounded-[2rem] text-[8px] xs:text-[10px] font-black uppercase tracking-[0.2em] xs:tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-2 xs:gap-3 relative overflow-hidden group/buy ${
                        canAfford 
                          ? "bg-primary text-white hover:brightness-110 shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02]" 
                          : "bg-white/5 text-slate-600 cursor-not-allowed border-2 border-white/5"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base xs:text-lg">payments</span>
                      Acquire
                      {canAfford && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/buy:translate-x-full transition-transform duration-1000"></div>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xs:gap-10">
          {POWERUPS.map((p, idx) => {
            const canAfford = coins >= p.cost;
            const saved = localStorage.getItem("qs_powerups") || "{}";
            const ownedCount = JSON.parse(saved)[p.id] || 0;

            return (
              <div 
                key={p.id} 
                style={{ animationDelay: `${idx * 100}ms` }}
                className="group relative bg-white/5 backdrop-blur-md border-2 border-white/10 p-8 xs:p-12 rounded-[2rem] xs:rounded-[4rem] hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-700 space-y-6 xs:space-y-10 animate-in fade-in slide-in-from-bottom-12 overflow-hidden"
              >
                {/* Decorative Background Icon */}
                <span className="absolute -bottom-6 xs:-bottom-10 -right-6 xs:-right-10 material-symbols-outlined text-8xl xs:text-[12rem] text-white/5 transition-transform duration-1000 group-hover:scale-110 group-hover:-rotate-12 pointer-events-none">
                  {p.icon}
                </span>

                <div className="flex items-start justify-between relative z-10">
                  <div className="size-16 xs:size-24 rounded-2xl xs:rounded-[2.5rem] bg-primary/10 border border-primary/20 text-primary flex items-center justify-center transition-all duration-1000 group-hover:scale-110 group-hover:rotate-6 shadow-[0_15px_30px_rgba(var(--primary-rgb),0.2)]">
                    <span className="material-symbols-outlined text-3xl xs:text-5xl">{p.icon}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] xs:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] xs:tracking-[0.3em] mb-1 xs:mb-2">Inventory</div>
                    <div className="text-3xl xs:text-5xl font-black text-white tabular-nums tracking-tighter group-hover:scale-110 transition-transform duration-500">{ownedCount}</div>
                  </div>
                </div>

                <div className="space-y-2 xs:space-y-4 relative z-10">
                  <h3 className="text-2xl xs:text-4xl font-black text-white tracking-tighter">{p.name}</h3>
                  <p className="text-slate-400 text-sm xs:text-base leading-relaxed font-light line-clamp-3">{p.description}</p>
                </div>

                <button
                  onClick={() => {
                    if (buyPowerUp(p)) {
                      setFeedback({ type: 'success', message: `Purchased ${p.name}!` });
                    } else {
                      setFeedback({ type: 'error', message: 'Insufficient coins!' });
                    }
                  }}
                  disabled={!canAfford}
                  className={`w-full py-4 xs:py-6 rounded-2xl xs:rounded-[2.5rem] text-[8px] xs:text-[10px] font-black uppercase tracking-[0.3em] xs:tracking-[0.4em] transition-all duration-700 flex items-center justify-center gap-3 xs:gap-4 relative overflow-hidden group/pwr ${
                    canAfford 
                      ? "bg-primary text-white hover:brightness-110 shadow-[0_25px_50px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02]" 
                      : "bg-white/5 text-slate-600 cursor-not-allowed border-2 border-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg xs:text-2xl">monetization_on</span>
                  {p.cost.toLocaleString()}
                  {canAfford && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/pwr:translate-x-full transition-transform duration-1000"></div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

enum HostScreen {
  SetSelection = "setSelection",
  QuestionEditor = "questionEditor",
  Lobby = "lobby",
  LiveGame = "liveGame",
  Leaderboard = "leaderboard",
}

function Host() {
  const [hostScreen, setHostScreen] = useState<HostScreen>(HostScreen.SetSelection);

  const [baseUrl, setBaseUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      // If we're on the Vite dev port, assume the server is on 4000
      if (window.location.port === '5173') {
        return `${protocol}//${window.location.hostname}:4000`;
      }
      return `${protocol}//${window.location.host}`;
    }
    return "";
  });
  const socket = useMemo(() => createSocket(baseUrl), [baseUrl]);

  const [title, setTitle] = useState("Sample Set");
  const [questions, setQuestions] = useState<Question[]>([
    { prompt: "2 + 2 = ?", choices: [{ text: "3" }, { text: "4" }, { text: "5" }, { text: "22" }], correctIndex: 1, timeLimitSec: 20 },
    { prompt: "Capital of France?", choices: [{ text: "Berlin" }, { text: "Madrid" }, { text: "Paris" }, { text: "Rome" }], correctIndex: 2, timeLimitSec: 20 }
  ]);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [status, setStatus] = useState("lobby");
  const [qIndex, setQIndex] = useState(-1);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ nickname: string; score: number; streak: number; sphereId?: string }[]>([]);
  const [questionResults, setQuestionResults] = useState<{ correctIndex: number; answers: Record<string, number>; fastestCorrectPlayerId?: string; fastestCorrectTimeMs?: number } | null>(null);
  const [players, setPlayers] = useState<{ id: string; nickname: string; score: number; streak: number; sphereId?: string }[]>([]);
  const [locked, setLocked] = useState(false);
  const [mode, setMode] = useState<"classic" | "team" | "survival" | "sprint" | "cafe">("classic");
  const [teamNames, setTeamNames] = useState<string[]>(["Red", "Blue"]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<{ name: string; score: number; size: number }[] | undefined>(undefined);
  const [cafeMoney, setCafeMoney] = useState<number>(0);
  const [cafeCustomers, setCafeCustomers] = useState<{ id: string; servedBy: string }[]>([]);
  const [bannedWordsStr, setBannedWordsStr] = useState<string>("badword,offensive,swear");
  const [livesPerPlayer, setLivesPerPlayer] = useState<number>(3);

  React.useEffect(() => {
    function onStateUpdate(s: any) {
      if (s.code) setRoomCode(s.code);
      setStatus(s.status);
      setQIndex(s.qIndex);
      setLeaderboard(s.leaderboard);
      setLocked(!!s.locked);
      setMode(s.mode || "classic");
      setTeamLeaderboard(s.teamLeaderboard);
      setCafeMoney(s.cafeMoney ?? 0);
      setCafeCustomers(s.cafeCustomers ?? []);
    }
    function onQuestion(q: { index: number; prompt: string; choices: Choice[]; timeLimitSec: number }) {
      setQuestionResults(null);
      setCurrentQ({ prompt: q.prompt, choices: q.choices, correctIndex: -1, timeLimitSec: q.timeLimitSec });
    }
    function onQuestionResults(res: { index: number; correctIndex: number; answers: Record<string, number>; fastestCorrectPlayerId?: string; fastestCorrectTimeMs?: number }) {
      setQuestionResults({ correctIndex: res.correctIndex, answers: res.answers, fastestCorrectPlayerId: res.fastestCorrectPlayerId, fastestCorrectTimeMs: res.fastestCorrectTimeMs });
    }
    function onEnded() {
      setStatus("ended");
    }
    function onFrozen({ duration }: { duration: number }) {
      setIsFrozen(true);
      setTimeout(() => setIsFrozen(false), duration);
    }
    function onHostPlayers(list: any[]) {
      setPlayers(list);
    }
    socket.on("state:update", onStateUpdate);
    socket.on("game:question", onQuestion);
    socket.on("game:questionResults", onQuestionResults);
    socket.on("host:players", onHostPlayers);
    socket.on("game:ended", onEnded);
    return () => {
      socket.off("state:update", onStateUpdate);
      socket.off("game:question", onQuestion);
      socket.off("game:questionResults", onQuestionResults);
      socket.off("host:players", onHostPlayers);
      socket.off("game:ended", onEnded);
    };
  }, [socket]);

  function addQuestion() {
    setQuestions((q) => [...q, { prompt: "", choices: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }], correctIndex: 0, timeLimitSec: 20 }]);
  }
  function updateQuestion(index: number, updater: (q: Question) => Question) {
    setQuestions((arr) => arr.map((q, i) => (i === index ? updater(q) : q)));
  }

  function createRoom(overrideSet?: QuestionSet, onSuccess?: () => void) {
    const set = overrideSet || { title, questions };
    const bannedWords = bannedWordsStr.split(",").map((w) => w.trim()).filter(Boolean);
    socket.emit("host:createRoom", { set, mode, teamNames, bannedWords, livesPerPlayer }, (res: { code: string }) => {
      if (res && res.code) {
        setRoomCode(res.code);
        if (onSuccess) onSuccess();
      }
    });
  }
  function startGame() {
    if (!roomCode) return;
    socket.emit("host:start", roomCode);
  }
  function nextQuestion() {
    if (!roomCode) return;
    socket.emit("host:next", roomCode);
  }
  function lockRoom() {
    if (!roomCode) return;
    socket.emit("host:lock", roomCode);
  }
  function unlockRoom() {
    if (!roomCode) return;
    socket.emit("host:unlock", roomCode);
  }
  function mutePlayer(id: string) {
    if (!roomCode) return;
    socket.emit("host:mute", { code: roomCode, playerId: id });
  }
  function unmutePlayer(id: string) {
    if (!roomCode) return;
    socket.emit("host:unmute", { code: roomCode, playerId: id });
  }
  function kickPlayer(id: string) {
    if (!roomCode) return;
    socket.emit("host:kick", { code: roomCode, playerId: id });
  }
  function exportCsv() {
    if (!roomCode) return;
    window.open(`${baseUrl}/api/session/${roomCode}/export.csv`, "_blank");
  }
  function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => {
      const lines = t.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      const parsed: Question[] = [];
      for (const line of lines) {
        const parts = line.split(",");
        if (parts.length < 6) continue;
        const prompt = parts[0];
        const a = parts[1], b = parts[2], c = parts[3], d = parts[4];
        const correct = Number(parts[5]) - 1;
        parsed.push({ prompt, choices: [{ text: a }, { text: b }, { text: c }, { text: d }], correctIndex: Math.max(0, Math.min(3, correct)), timeLimitSec: 20 });
      }
      if (parsed.length > 0) {
        setTitle("Imported CSV");
        setQuestions(parsed);
      }
    });
  }
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " && status !== "lobby" && status !== "ended") {
        e.preventDefault();
        nextQuestion();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, nextQuestion]);
  function applySettings() {
    if (!roomCode) return;
    const bannedWords = bannedWordsStr.split(",").map((w) => w.trim()).filter(Boolean);
    socket.emit("host:updateSettings", { code: roomCode, bannedWords, livesPerPlayer });
  }

  return (
    <div className="relative w-full flex flex-col bg-background-light dark:bg-background-dark text-white font-display antialiased rounded-3xl border border-border-custom/30 shadow-2xl mb-12">
      <div className="absolute inset-0 bg-pattern pointer-events-none opacity-30"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 flex-1">
        {hostScreen === HostScreen.SetSelection && (
          <SetSelectionScreen 
            setHostScreen={setHostScreen} 
            setTitle={setTitle} 
            setQuestions={setQuestions} 
            createRoom={createRoom}
            mode={mode}
            setMode={setMode}
          />
        )}
        {hostScreen === HostScreen.QuestionEditor && (
          <QuestionEditorScreen 
            setHostScreen={setHostScreen} 
            title={title} 
            setTitle={setTitle} 
            questions={questions} 
            setQuestions={setQuestions} 
            addQuestion={addQuestion} 
            updateQuestion={updateQuestion} 
            importCsv={importCsv} 
            createRoom={createRoom}
          />
        )}
        {hostScreen === HostScreen.Lobby && (
          <LobbyScreen 
            setHostScreen={setHostScreen} 
            roomCode={roomCode} 
            startGame={startGame} 
            players={players} 
          />
        )}
        {hostScreen === HostScreen.LiveGame && <LiveGameScreen setHostScreen={setHostScreen} status={status} qIndex={qIndex} currentQ={currentQ} players={players} nextQuestion={nextQuestion} locked={locked} lockRoom={lockRoom} unlockRoom={unlockRoom} mutePlayer={mutePlayer} unmutePlayer={unmutePlayer} kickPlayer={kickPlayer} exportCsv={exportCsv} applySettings={applySettings} bannedWordsStr={bannedWordsStr} setBannedWordsStr={setBannedWordsStr} livesPerPlayer={livesPerPlayer} setLivesPerPlayer={setLivesPerPlayer} mode={mode} setMode={setMode} teamNames={teamNames} setTeamNames={setTeamNames} teamLeaderboard={teamLeaderboard} cafeMoney={cafeMoney} cafeCustomers={cafeCustomers} roomCode={roomCode} />}
        {hostScreen === HostScreen.Leaderboard && <LeaderboardScreen setHostScreen={setHostScreen} leaderboard={leaderboard} mode={mode} teamLeaderboard={teamLeaderboard} />}
      </div>
    </div>
  );
}



interface SetSelectionScreenProps {
  setHostScreen: (screen: HostScreen) => void;
  setTitle: (title: string) => void;
  setQuestions: (questions: Question[]) => void;
  createRoom: (overrideSet?: QuestionSet, onSuccess?: () => void) => void;
  mode: string;
  setMode: (mode: "classic" | "team" | "survival" | "sprint" | "cafe") => void;
}

function SetSelectionScreen({ setHostScreen, setTitle, setQuestions, createRoom, mode, setMode }: SetSelectionScreenProps) {
  const mockSets = [
    {
      title: "Science & Nature",
      questions: [
        { prompt: "What is the largest planet in our solar system?", choices: [{ text: "Earth" }, { text: "Jupiter" }, { text: "Mars" }, { text: "Saturn" }], correctIndex: 1, timeLimitSec: 20 },
        { prompt: "Which element has the chemical symbol O?", choices: [{ text: "Gold" }, { text: "Oxygen" }, { text: "Silver" }, { text: "Iron" }], correctIndex: 1, timeLimitSec: 20 }
      ]
    },
    {
      title: "History Buffs",
      questions: [
        { prompt: "In which year did WWII end?", choices: [{ text: "1940" }, { text: "1945" }, { text: "1950" }, { text: "1939" }], correctIndex: 1, timeLimitSec: 20 },
        { prompt: "Who was the first President of the United States?", choices: [{ text: "Lincoln" }, { text: "Washington" }, { text: "Jefferson" }, { text: "Adams" }], correctIndex: 1, timeLimitSec: 20 }
      ]
    }
  ];

  const MODES = [
    { id: "classic", name: "Classic", icon: "emoji_events", color: "from-blue-500 to-blue-600", description: "Standard competitive mode." },
    { id: "cafe", name: "Cafe", icon: "coffee", color: "from-orange-500 to-orange-600", description: "Serve customers and build your business." },
    { id: "survival", name: "Survival", icon: "favorite", color: "from-red-500 to-red-600", description: "Last player standing wins." },
    { id: "sprint", name: "Sprint", icon: "speed", color: "from-green-500 to-green-600", description: "Race against the clock." },
    { id: "team", name: "Teams", icon: "groups", color: "from-purple-500 to-purple-600", description: "Collaborate with your squad." },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-6 xs:py-8 sm:py-12 px-4 xs:px-6 sm:px-8 space-y-10 xs:space-y-12 sm:space-y-16">
        {/* Header Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 xs:p-6 sm:p-10 rounded-2xl xs:rounded-3xl sm:rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 xs:gap-8">
          <div className="space-y-2 xs:space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 xs:px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] xs:text-[10px] font-black uppercase tracking-[0.3em] xs:tracking-[0.4em]">
              <span className="material-symbols-outlined text-xs xs:text-sm">settings</span>
              Session Configuration
            </div>
            <h2 className="text-2xl xs:text-3xl sm:text-5xl font-black text-white tracking-tight">Host Your Session</h2>
            <p className="text-slate-400 text-xs xs:text-sm sm:text-base font-medium">Select a game mode and choose a curriculum to begin.</p>
          </div>
          
          <button 
            onClick={() => {
              setTitle("New Question Set");
              setQuestions([{ prompt: "", choices: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }], correctIndex: 0, timeLimitSec: 20 }]);
              setHostScreen(HostScreen.QuestionEditor);
            }}
            className="group w-full md:w-auto px-6 py-4 sm:px-10 sm:py-6 bg-primary text-white rounded-xl xs:rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3 xs:gap-4 shadow-2xl shadow-primary/30 active:scale-95 text-[10px] xs:text-sm sm:text-base"
          >
            <div className="size-8 sm:size-10 rounded-lg xs:rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
              <span className="material-symbols-outlined text-lg xs:text-xl sm:text-2xl">add</span>
            </div>
            Create New Set
          </button>
        </div>

        {/* Mode Selection */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3 xs:gap-4">
            <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">sports_esports</span>
            </div>
            <h3 className="text-base xs:text-lg sm:text-2xl font-black text-white uppercase tracking-[0.2em]">Select Game Mode</h3>
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`relative group p-5 xs:p-6 sm:p-8 rounded-2xl xs:rounded-3xl sm:rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden flex flex-col h-full ${
                  mode === m.id 
                    ? "border-primary bg-primary/10 shadow-2xl shadow-primary/20 scale-[1.02] sm:scale-[1.05]" 
                    : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:translate-y-[-4px]"
                }`}
              >
                {/* Active Indicator */}
                <div className={`absolute top-0 right-0 w-24 xs:w-32 h-24 xs:h-32 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-5 transition-opacity blur-2xl`}></div>
                
                <div className={`size-10 xs:size-12 sm:size-16 rounded-lg xs:rounded-xl sm:rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white mb-4 sm:mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                  <span className="material-symbols-outlined text-xl xs:text-2xl sm:text-3xl">{m.icon}</span>
                </div>
                
                <div className="flex-1 space-y-1.5 sm:space-y-2">
                  <h4 className="text-base xs:text-lg sm:text-xl font-black text-white">{m.name}</h4>
                  <p className="text-[10px] xs:text-xs sm:text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">{m.description}</p>
                </div>

                {mode === m.id && (
                  <div className="mt-4 sm:mt-6 flex items-center gap-2 text-primary font-black text-[8px] xs:text-[9px] sm:text-[10px] uppercase tracking-widest animate-pulse">
                    <span className="material-symbols-outlined text-sm xs:text-base sm:text-lg">check_circle</span>
                    Active
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Set Selection */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-4">
            <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">library_books</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-[0.2em]">Curriculum Library</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {mockSets.map((set, i) => (
              <div key={i} className="group bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] hover:border-primary/50 transition-all relative overflow-hidden flex flex-col h-full shadow-2xl">
                {/* Decorative Background Icon */}
                <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-all duration-700 rotate-12 scale-150">
                  <span className="material-symbols-outlined text-[8rem] sm:text-[12rem]">quiz</span>
                </div>
                
                <div className="relative z-10 flex-1 space-y-4 sm:space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="size-12 sm:size-16 rounded-xl sm:rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl sm:text-3xl">menu_book</span>
                    </div>
                    <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                      {set.questions.length} Questions
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">{set.title}</h3>
                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                      <span className="material-symbols-outlined text-xs sm:text-sm">person</span>
                      System Default
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-8 sm:mt-10 flex gap-3 sm:gap-4">
                  <button 
                    onClick={() => {
                      setTitle(set.title);
                      setQuestions(set.questions);
                      setHostScreen(HostScreen.QuestionEditor);
                    }}
                    className="flex-1 py-3 sm:py-4 bg-white/5 border border-white/10 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                  >
                    Edit Set
                  </button>
                  <button 
                    onClick={() => {
                      setTitle(set.title);
                      setQuestions(set.questions);
                      createRoom({ title: set.title, questions: set.questions }, () => {
                        setHostScreen(HostScreen.Lobby);
                      });
                    }}
                    className="flex-[2] py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:brightness-110 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xs sm:text-sm">sensors</span>
                    Host Session
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State / Add New Placeholder */}
            <button 
              onClick={() => {
                setTitle("New Question Set");
                setQuestions([{ prompt: "", choices: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }], correctIndex: 0, timeLimitSec: 20 }]);
                setHostScreen(HostScreen.QuestionEditor);
              }}
              className="group border-4 border-dashed border-white/5 rounded-3xl sm:rounded-[3rem] flex flex-col items-center justify-center p-8 sm:p-12 space-y-4 sm:space-y-6 hover:border-primary/30 hover:bg-primary/5 transition-all duration-500 min-h-[300px] sm:min-h-[400px]"
            >
              <div className="size-16 sm:size-20 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500">
                <span className="material-symbols-outlined text-3xl sm:text-4xl">add_circle</span>
              </div>
              <div className="text-center">
                <p className="text-white font-black text-lg sm:text-xl mb-1 sm:mb-2">Create Custom Set</p>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">Build your own curriculum from scratch.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LobbyScreenProps {
  setHostScreen: (screen: HostScreen) => void;
  roomCode: string | null;
  startGame: () => void;
  players: { id: string; nickname: string; score: number; streak: number }[];
}

function LobbyScreen({ setHostScreen, roomCode, startGame, players }: LobbyScreenProps) {
  const joinUrl = typeof window !== 'undefined' ? window.location.host : '...';

  return (
    <div className="bg-[#0f172a] min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col p-4 sm:p-12 flex-1">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 sm:mb-12 shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 p-4 xs:p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl gap-6 sm:gap-0">
          <div className="flex items-center gap-3 xs:gap-4 sm:gap-6 w-full sm:w-auto">
            <button 
              onClick={() => setHostScreen(HostScreen.SetSelection)}
              className="size-10 xs:size-12 sm:size-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-white shadow-lg shrink-0"
            >
              <span className="material-symbols-outlined text-lg xs:text-xl sm:text-2xl">arrow_back</span>
            </button>
            <div className="h-8 sm:h-10 w-px bg-white/10"></div>
            <div className="min-w-0">
              <div className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.3em] xs:tracking-[0.4em] mb-0.5 sm:mb-1">Session Access Point</div>
              <div className="text-white font-bold text-xs xs:text-sm sm:text-xl flex items-center gap-2 sm:gap-3 truncate">
                Join at <span className="text-primary font-black tracking-tight">{joinUrl}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 xs:gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
            <button className="size-10 xs:size-12 sm:size-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white group">
              <span className="material-symbols-outlined text-lg xs:text-xl sm:text-2xl group-hover:scale-110 transition-transform">volume_up</span>
            </button>
            <button 
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
              className="size-10 xs:size-12 sm:size-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white group"
            >
              <span className="material-symbols-outlined text-lg xs:text-xl sm:text-2xl group-hover:scale-110 transition-transform">fullscreen</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12 sm:space-y-16 py-8 sm:py-12">
          <div className="space-y-8 sm:space-y-10 w-full max-w-4xl">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-black uppercase tracking-[0.4em]">
                Secure Entry Code
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4 justify-center items-center">
                {(roomCode || "------").split("").map((char, i) => (
                  <div key={i} className="size-14 xs:size-20 sm:size-28 md:size-36 bg-white/5 border-2 border-white/10 rounded-xl sm:rounded-[2rem] flex items-center justify-center backdrop-blur-2xl shadow-2xl transition-all hover:scale-105 sm:hover:scale-110 hover:border-primary/50 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-3xl xs:text-5xl sm:text-7xl md:text-9xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:text-primary transition-colors relative z-10">
                      {char}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 sm:gap-4 px-6 py-3 sm:px-10 sm:py-5 rounded-2xl sm:rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
                <div className="size-10 sm:size-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl animate-pulse">groups</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-2xl sm:text-3xl font-black text-white leading-none">{players.length}</span>
                  <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Participants</span>
                </div>
              </div>
              <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] animate-pulse">
                {roomCode ? "Accepting Incoming Transmissions..." : "Establishing Secure Channel..."}
              </p>
            </div>
          </div>

          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 xs:gap-6 sm:gap-8">
              {players.map((p, idx) => {
                const sphere = SPHERES.find(s => s.id === p.sphereId) || SPHERES[0];
                return (
                  <div 
                    key={p.id} 
                    className="animate-in zoom-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center gap-3 sm:gap-4 group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="size-16 xs:size-20 sm:size-24 rounded-2xl sm:rounded-[2.5rem] bg-white/5 border-2 sm:border-4 border-white/10 text-white flex items-center justify-center text-3xl xs:text-4xl sm:text-5xl shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:border-primary/50 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl sm:rounded-[2.5rem] transition-opacity"></div>
                      <span className="relative z-10 filter drop-shadow-lg">{sphere.emoji}</span>
                    </div>
                    <div className="text-white font-black text-[10px] xs:text-xs sm:text-sm truncate w-full text-center uppercase tracking-widest opacity-80 group-hover:opacity-100 group-hover:text-primary transition-all">{p.nickname}</div>
                  </div>
                );
              })}
              {players.length === 0 && (
                <div className="col-span-full py-12 xs:py-16 sm:py-20 border-2 border-dashed border-white/5 rounded-2xl sm:rounded-[3rem] flex flex-col items-center justify-center space-y-3 sm:space-y-4 opacity-30">
                  <span className="material-symbols-outlined text-4xl xs:text-5xl sm:text-6xl">sensors_off</span>
                  <p className="font-black uppercase tracking-widest text-[10px] xs:text-xs sm:text-sm">No Signal Detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 xs:bottom-8 xs:right-8 sm:bottom-12 sm:right-12 z-50">
          <button 
            onClick={startGame}
            disabled={players.length === 0}
            className="group px-8 py-4 xs:px-12 xs:py-6 sm:px-16 sm:py-8 bg-green-500 text-white rounded-2xl sm:rounded-[2.5rem] font-black text-xl xs:text-2xl sm:text-3xl uppercase tracking-widest hover:bg-green-400 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all shadow-2xl shadow-green-500/40 flex items-center gap-4 sm:gap-6 transform hover:scale-105 active:scale-95 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="material-symbols-outlined text-2xl xs:text-3xl sm:text-4xl relative z-10">play_arrow</span>
            <span className="relative z-10">Start Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface QuestionEditorScreenProps {
  setHostScreen: (screen: HostScreen) => void;
  title: string;
  setTitle: (title: string) => void;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  addQuestion: () => void;
  updateQuestion: (index: number, updater: (q: Question) => Question) => void;
  importCsv: (e: React.ChangeEvent<HTMLInputElement>) => void;
  createRoom: (overrideSet?: QuestionSet, onSuccess?: () => void) => void;
}

function QuestionEditorScreen({ setHostScreen, title, setTitle, questions, setQuestions, addQuestion, updateQuestion, importCsv, createRoom }: QuestionEditorScreenProps) {
  return (
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-6 sm:py-12 px-4 sm:px-8 flex flex-col min-h-screen">
        {/* Header Dashboard */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
            <button 
              onClick={() => setHostScreen(HostScreen.SetSelection)}
              className="size-12 sm:size-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-white shadow-lg group shrink-0"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl group-hover:translate-x-[-2px] transition-transform">arrow_back</span>
            </button>
            <div className="space-y-0.5 sm:space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="material-symbols-outlined text-xs">edit_note</span>
                Curriculum Editor
              </div>
              <h2 className="text-xl xs:text-2xl sm:text-4xl font-black tracking-tight text-white">Question Designer</h2>
            </div>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 w-full md:w-auto">
            <label className="flex-1 md:flex-none cursor-pointer px-6 sm:px-8 py-3 sm:py-4 bg-white/5 border border-white/10 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[8px] xs:text-[9px] sm:text-xs hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95">
              <span className="material-symbols-outlined text-lg sm:text-xl">upload_file</span>
              Import CSV
              <input type="file" accept=".csv" onChange={importCsv} className="hidden" />
            </label>
            <button 
              className="flex-1 md:flex-none px-8 sm:px-12 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[8px] xs:text-[9px] sm:text-xs hover:brightness-110 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 sm:gap-3 active:scale-95"
              onClick={() => {
                createRoom(undefined, () => {
                  setHostScreen(HostScreen.Lobby);
                });
              }}
            >
              Host Session
              <span className="material-symbols-outlined text-lg sm:text-xl">sensors</span>
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Title Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-7 sm:size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-base sm:text-lg">label</span>
                </div>
                <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Curriculum Identity</label>
              </div>
              <input 
                className="w-full h-14 xs:h-16 sm:h-20 px-6 sm:px-8 rounded-2xl sm:rounded-3xl bg-background-dark/50 border-2 border-white/5 text-lg xs:text-xl sm:text-3xl font-black text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-white/5"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter Assessment Title..." 
              />
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-6 sm:space-y-8">
            {questions.map((q, i) => (
              <div 
                key={i} 
                style={{ animationDelay: `${i * 100}ms` }}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 p-5 xs:p-6 sm:p-10 rounded-2xl xs:rounded-[2rem] sm:rounded-[3rem] shadow-2xl hover:border-primary/30 transition-all duration-700 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8"
              >
                <div className="absolute top-0 left-0 w-1 sm:w-2 h-full bg-primary opacity-20 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute -bottom-12 -right-12 size-32 xs:size-40 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                <div className="flex flex-col lg:flex-row gap-6 xs:gap-8 sm:gap-10 relative z-10">
                  {/* Question Main Info */}
                  <div className="flex-1 space-y-6 sm:space-y-8">
                    <div className="flex gap-4 sm:gap-6">
                      <div className="size-10 xs:size-12 sm:size-14 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-base xs:text-lg sm:text-xl shrink-0 border border-primary/20 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        {i + 1}
                      </div>
                      <div className="flex-1 space-y-1.5 xs:space-y-2 sm:space-y-3">
                        <label className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary/60 transition-colors">Inquiry Prompt</label>
                        <textarea 
                          className="w-full bg-transparent border-b-2 border-white/5 focus:border-primary outline-none py-1 sm:py-2 text-lg xs:text-xl sm:text-2xl font-black transition-all placeholder:text-white/5 resize-none h-auto min-h-[50px] xs:min-h-[60px] sm:min-h-[80px]"
                          value={q.prompt} 
                          onChange={(e) => updateQuestion(i, (prev) => ({ ...prev, prompt: e.target.value }))} 
                          placeholder="What is the primary objective of this inquiry?" 
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    {/* Choices Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                      {q.choices.map((c, j) => (
                        <div key={j} className="relative group/choice">
                          <div className="absolute left-3.5 xs:left-4 sm:left-5 top-1/2 -translate-y-1/2 z-10">
                            <button 
                              onClick={() => updateQuestion(i, (prev) => ({ ...prev, correctIndex: j }))}
                              className={`size-6 xs:size-7 sm:size-8 rounded-lg sm:rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${
                                q.correctIndex === j 
                                  ? 'bg-primary border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] scale-110' 
                                  : 'border-white/10 hover:border-white/30 bg-white/5'
                              }`}
                            >
                              {q.correctIndex === j ? (
                                <span className="material-symbols-outlined text-white text-[10px] sm:text-sm font-black animate-in zoom-in duration-300">check</span>
                              ) : (
                                <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-slate-500 group-hover/choice:text-primary transition-colors">{String.fromCharCode(65 + j)}</span>
                              )}
                            </button>
                          </div>
                          <input 
                            className={`w-full h-12 xs:h-14 sm:h-16 pl-12 xs:pl-14 sm:pl-16 pr-4 sm:pr-6 rounded-xl sm:rounded-2xl bg-background-dark/30 border-2 text-white text-sm xs:text-base sm:text-lg font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-500 ${
                              q.correctIndex === j 
                                ? 'border-primary/50 bg-primary/5' 
                                : 'border-white/5 focus:border-primary/40 hover:bg-white/[0.02]'
                            }`}
                            value={c.text} 
                            onChange={(e) => updateQuestion(i, (prev) => {
                              const choices = prev.choices.slice();
                              choices[j] = { text: e.target.value };
                              return { ...prev, choices };
                            })} 
                            placeholder={`Option ${String.fromCharCode(65 + j)}`} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settings Panel */}
                  <div className="lg:w-64 flex flex-col gap-6 pt-6 lg:pt-0 lg:pl-10 lg:border-l border-white/5">
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <label className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 group-hover:text-primary/60 transition-colors">
                          <span className="material-symbols-outlined text-xs xs:text-sm">timer</span>
                          Time Limit
                        </label>
                        <div className="flex items-center gap-2 sm:gap-3 bg-background-dark/50 p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-primary/20 transition-all">
                          <input 
                            className="w-full bg-transparent text-white text-lg xs:text-xl sm:text-2xl font-black outline-none text-center"
                            type="number" min={5} max={120} 
                            value={q.timeLimitSec ?? 20} 
                            onChange={(e) => updateQuestion(i, (prev) => ({ ...prev, timeLimitSec: Number(e.target.value) }))} 
                          />
                          <span className="text-[7px] xs:text-[8px] sm:text-[10px] font-black text-slate-500 uppercase">SEC</span>
                        </div>
                      </div>

                      <div className="lg:mt-auto flex items-end">
                        <button 
                          onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                          className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-red-500/5 text-red-500/40 hover:bg-red-500/20 hover:text-red-500 transition-all duration-500 text-[9px] xs:text-[10px] sm:text-xs font-black uppercase tracking-widest active:scale-95 group/del"
                        >
                          <span className="material-symbols-outlined text-sm xs:text-base sm:text-lg group-hover/del:rotate-12 transition-transform">delete</span>
                          <span className="hidden sm:inline">Remove Item</span>
                          <span className="sm:hidden">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {questions.length === 0 && (
              <div className="py-20 sm:py-32 bg-white/5 backdrop-blur-xl border-4 border-dashed border-white/10 rounded-[2rem] sm:rounded-[3rem] text-center space-y-4 sm:space-y-6">
                <div className="size-20 sm:size-24 bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-4xl sm:text-5xl text-slate-600">post_add</span>
                </div>
                <div className="space-y-1 sm:space-y-2 px-4">
                  <p className="text-xl sm:text-2xl font-black text-white tracking-tight">No Questions Detected</p>
                  <p className="text-slate-500 font-medium text-sm sm:text-base">Click the button below to add your first inquiry.</p>
                </div>
              </div>
            )}

            {/* Add Question Button */}
            <button 
              onClick={addQuestion}
              className="group w-full py-12 sm:py-16 rounded-[2rem] sm:rounded-[3rem] border-4 border-dashed border-white/5 bg-white/[0.02] text-slate-500 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-500 flex flex-col items-center gap-4 sm:gap-6 shadow-2xl active:scale-[0.99]"
            >
              <div className="size-16 sm:size-20 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                <span className="material-symbols-outlined text-4xl sm:text-5xl">add</span>
              </div>
              <div className="text-center px-4">
                <span className="block text-xl sm:text-2xl font-black uppercase tracking-[0.2em] mb-1">Add New Question</span>
                <span className="text-xs sm:text-sm font-medium opacity-60">Extend your curriculum content</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LiveGameScreenProps {
  setHostScreen: (screen: HostScreen) => void;
  status: string;
  qIndex: number;
  currentQ: Question | null;
  players: { id: string; nickname: string; score: number; streak: number }[];
  nextQuestion: () => void;
  locked: boolean;
  lockRoom: () => void;
  unlockRoom: () => void;
  mutePlayer: (id: string) => void;
  unmutePlayer: (id: string) => void;
  kickPlayer: (id: string) => void;
  exportCsv: () => void;
  applySettings: () => void;
  bannedWordsStr: string;
  setBannedWordsStr: (words: string) => void;
  livesPerPlayer: number;
  setLivesPerPlayer: (lives: number) => void;
  mode: "classic" | "team" | "survival" | "sprint" | "cafe";
  setMode: (mode: "classic" | "team" | "survival" | "sprint" | "cafe") => void;
  teamNames: string[];
  setTeamNames: (names: string[]) => void;
  teamLeaderboard: { name: string; score: number; size: number }[] | undefined;
  cafeMoney: number;
  cafeCustomers: { id: string; servedBy: string }[];
  roomCode: string | null;
}

function LiveGameScreen({ setHostScreen, status, qIndex, currentQ, players, nextQuestion, locked, lockRoom, unlockRoom, mutePlayer, unmutePlayer, kickPlayer, exportCsv, applySettings, bannedWordsStr, setBannedWordsStr, livesPerPlayer, setLivesPerPlayer, mode, setMode, teamNames, setTeamNames, teamLeaderboard, cafeMoney, cafeCustomers, roomCode }: LiveGameScreenProps) {
  const joinUrl = typeof window !== 'undefined' ? window.location.host : '...';

  return (
    <div className="bg-background-dark min-h-screen selection:bg-primary/30">
      <div className="max-w-[1600px] mx-auto py-6 sm:py-12 px-4 sm:px-8 flex flex-col gap-6 sm:gap-10">
        {/* Header Dashboard - Ultra Glassmorphism */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 sm:gap-10 bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 xs:p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Decorative Background Glow */}
          <div className="absolute -top-24 -left-24 size-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-colors duration-1000"></div>
          
          <div className="relative space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em]">Live Transmission</span>
              </div>
              <div className="hidden xs:block px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">v4.0.2-stable</span>
              </div>
            </div>
            
            <h2 className="text-3xl xs:text-4xl sm:text-5xl font-black tracking-tighter text-white flex items-center gap-4 sm:gap-6">
              Command Center
              <span className="text-white/10 font-thin text-2xl xs:text-3xl sm:text-4xl">/</span>
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent uppercase tracking-widest text-xl xs:text-2xl sm:text-3xl">{status}</span>
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-6 sm:gap-8 w-full lg:w-auto relative">
            <div className="flex-1 lg:flex-none flex flex-col sm:flex-row items-stretch sm:items-center gap-6 xs:gap-8 sm:gap-12 bg-black/40 px-6 xs:px-8 sm:px-10 py-5 xs:py-6 sm:py-6 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Access URL</div>
                <div className="text-lg xs:text-xl sm:text-xl font-black text-primary tracking-tight truncate max-w-[200px] xs:max-w-none">{joinUrl}</div>
              </div>
              <div className="hidden xs:block w-px h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
              <div className="space-y-1 sm:px-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Session Key</div>
                <div className="text-4xl xs:text-5xl sm:text-6xl font-black text-white tracking-[0.15em] font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{roomCode}</div>
              </div>
              <div className="hidden xs:block w-px h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Personnel</div>
                <div className="text-2xl xs:text-3xl sm:text-3xl font-black text-white tabular-nums">{players.length}</div>
              </div>
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                className="group/btn flex-1 lg:flex-none px-6 xs:px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl sm:rounded-3xl font-black text-[10px] xs:text-[11px] sm:text-[11px] uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95"
                onClick={exportCsv}
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl group-hover/btn:-translate-y-0.5 transition-transform">cloud_download</span>
                <span className="xs:inline">Export</span>
              </button>
              <button 
                className="group/btn flex-1 lg:flex-none px-8 xs:px-10 py-4 bg-primary text-white rounded-2xl sm:rounded-3xl font-black text-[10px] xs:text-[11px] sm:text-[11px] uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center gap-2 sm:gap-3 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100"
                onClick={nextQuestion}
                disabled={status !== "question" && status !== "results"}
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl group-hover/btn:translate-x-1 transition-transform">double_arrow</span>
                Advance
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-10">
          {/* Main Control Panel */}
          <div className="order-2 xl:order-1 xl:col-span-3 flex flex-col space-y-6 sm:space-y-10">
            {/* Active Status Display - Deep Focus */}
            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl relative group/panel">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="p-6 xs:p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 sm:mb-12">
                  <div className="flex items-center gap-4">
                    <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                      <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">monitoring</span>
                    </div>
                    <div>
                      <h3 className="text-[11px] sm:text-sm font-black text-white uppercase tracking-[0.3em]">Intelligence Feed</h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time Session Telemetry</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-2 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] backdrop-blur-md self-end sm:self-auto">
                    <div className="size-1.5 rounded-full bg-primary animate-ping"></div>
                    Syncing...
                  </div>
                </div>

                {currentQ ? (
                  <div className="space-y-8 sm:space-y-12 animate-in fade-in zoom-in-95 duration-700 ease-out">
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">Question {qIndex + 1}</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent"></div>
                      </div>
                      <div className="text-2xl xs:text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight max-w-4xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover/panel:translate-y-[-2px] transition-transform duration-700">
                        {currentQ.prompt}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                      {currentQ.choices.map((c, j) => (
                        <div key={j} className="group/choice relative p-5 xs:p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.03] border-2 border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-700 cursor-default animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${j * 100}ms` }}>
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/choice:opacity-100 transition-opacity rounded-[2rem] sm:rounded-[2.5rem]"></div>
                          <div className="relative flex items-center gap-5 sm:gap-8">
                            <div className="size-12 sm:size-16 rounded-2xl sm:rounded-3xl bg-white/5 text-white/40 flex items-center justify-center text-xl sm:text-2xl font-black shrink-0 border-2 border-white/5 group-hover/choice:bg-primary group-hover/choice:text-white group-hover/choice:border-primary/20 group-hover/choice:rotate-12 transition-all duration-700 shadow-xl">
                              {String.fromCharCode(65 + j)}
                            </div>
                            <div className="space-y-1">
                              <div className="text-lg xs:text-xl sm:text-2xl font-black text-slate-100 group-hover/choice:text-white group-hover/choice:translate-x-1 transition-all duration-500">{c.text}</div>
                              {status === 'results' && (
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-grow-x origin-left" style={{ width: '45%' }}></div>
                                  </div>
                                  <div className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest animate-in fade-in duration-1000">12 Personnel</div>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Choice Glow Effect */}
                          <div className="absolute -bottom-10 -right-10 size-24 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover/choice:opacity-100 transition-opacity duration-1000"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 sm:py-32 text-center space-y-8 sm:space-y-10">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-primary/20 blur-[40px] sm:blur-[50px] rounded-full animate-pulse"></div>
                      <div className="size-20 sm:size-28 bg-white/5 rounded-3xl sm:rounded-[2.5rem] border-2 border-white/10 flex items-center justify-center relative backdrop-blur-xl animate-bounce duration-[3000ms]">
                        <span className="material-symbols-outlined text-4xl sm:text-6xl text-primary/40">sensors</span>
                      </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="text-2xl xs:text-3xl sm:text-3xl font-black text-white tracking-tight">Signal Interrupted</div>
                      <p className="text-slate-500 max-w-xs sm:max-w-md mx-auto font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.3em] leading-relaxed">
                        Establishing downlink...<br/>Waiting for host authorization to proceed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Participant Grid - Tactical Roster */}
            <div className="flex-1 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 xs:p-8 sm:p-12 shadow-2xl flex flex-col relative overflow-hidden group/roster">
              <div className="absolute -bottom-24 -right-24 size-96 bg-primary/5 blur-[120px] rounded-full group-hover/roster:bg-primary/10 transition-colors duration-1000"></div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 sm:mb-12 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">grid_view</span>
                  </div>
                  <div>
                    <h3 className="text-[11px] sm:text-sm font-black text-white uppercase tracking-[0.3em]">Active Personnel</h3>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Deployment Status</p>
                  </div>
                </div>
                
                <button 
                  onClick={locked ? unlockRoom : lockRoom}
                  className={`group/lock w-full sm:w-auto flex items-center justify-center gap-3 sm:gap-4 px-5 sm:px-6 py-3 rounded-xl sm:rounded-2xl border-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 shadow-lg ${
                    locked 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl group-hover/lock:scale-110 transition-transform">
                    {locked ? 'lock' : 'lock_open'}
                  </span>
                  {locked ? 'Access Locked' : 'Access Open'}
                </button>
              </div>

              <div className="relative z-10">
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 xs:gap-5 sm:gap-6">
                  {players.map((p, idx) => {
                    const sphere = SPHERES.find(s => s.id === p.sphereId) || SPHERES[0];
                    return (
                      <div 
                        key={p.id} 
                        style={{ animationDelay: `${idx * 50}ms` }}
                        className="group/player relative p-5 xs:p-6 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-white/5 hover:border-primary/40 hover:bg-white/[0.06] transition-all duration-700 overflow-hidden animate-in fade-in zoom-in-95"
                      >
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover/player:opacity-100 transition-all flex gap-2 translate-x-4 group-hover/player:translate-x-0 z-20">
                          <button onClick={() => mutePlayer(p.id)} className="size-8 sm:size-9 rounded-lg sm:rounded-xl bg-white/10 text-white/60 flex items-center justify-center hover:bg-white/20 hover:text-white transition-all shadow-xl backdrop-blur-md hover:scale-110 active:scale-90">
                            <span className="material-symbols-outlined text-base sm:text-lg">volume_off</span>
                          </button>
                          <button onClick={() => kickPlayer(p.id)} className="size-8 sm:size-9 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-all shadow-xl backdrop-blur-md hover:scale-110 active:scale-90">
                            <span className="material-symbols-outlined text-base sm:text-lg">logout</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4 xs:gap-5 sm:gap-5 relative z-10">
                          <div className="size-12 xs:size-14 sm:size-16 rounded-xl sm:rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-3xl xs:text-4xl sm:text-4xl border border-white/10 shadow-2xl group-hover/player:scale-110 group-hover/player:rotate-3 transition-transform duration-700">
                            <span className="group-hover/player:animate-bounce duration-1000">{sphere.emoji}</span>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                            <div className="font-black text-white text-lg xs:text-xl sm:text-xl tracking-tight leading-none group-hover/player:text-primary transition-colors truncate">{p.nickname}</div>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="px-2 xs:px-2.5 py-0.5 sm:py-1 rounded-lg bg-primary/10 border border-primary/20 group-hover/player:bg-primary/20 transition-colors">
                                <span className="text-[8px] xs:text-[9px] sm:text-[9px] font-black text-primary tabular-nums tracking-widest">{p.score.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 px-2 xs:px-2.5 py-0.5 sm:py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 group-hover/player:bg-orange-500/20 transition-colors">
                                <span className="text-[8px] xs:text-[9px] sm:text-[9px] font-black text-orange-500 tabular-nums tracking-widest">🔥 {p.streak}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Player Status Glow */}
                        <div className="absolute -bottom-6 -left-6 size-12 bg-primary/10 blur-xl rounded-full opacity-0 group-hover/player:opacity-100 transition-opacity duration-1000"></div>
                      </div>
                    );
                  })}
                  {players.length === 0 && (
                    <div className="col-span-full py-16 sm:py-24 flex flex-col items-center justify-center space-y-4 sm:space-y-6 opacity-40">
                      <div className="size-20 sm:size-24 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center animate-spin-slow">
                        <span className="material-symbols-outlined text-4xl sm:text-5xl">radar</span>
                      </div>
                      <div className="text-center space-y-1 sm:space-y-2">
                        <div className="text-base sm:text-lg font-black text-white uppercase tracking-[0.2em]">Zero Contacts</div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Scanning for incoming personnel...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Settings Sidebar */}
          <div className="order-1 xl:order-2 space-y-6 sm:space-y-10">
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 xs:p-8 sm:p-10 shadow-2xl relative overflow-hidden group/sidebar">
              <div className="absolute -top-12 -right-12 size-48 bg-primary/10 blur-[60px] rounded-full group-hover/sidebar:bg-primary/20 transition-colors duration-1000"></div>
              
              <div className="flex items-center gap-4 mb-8 sm:mb-10 relative">
                <div className="size-8 xs:size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-lg xs:text-xl">tune</span>
                </div>
                <h3 className="text-[10px] xs:text-[11px] sm:text-sm font-black text-white uppercase tracking-[0.3em]">Protocol Config</h3>
              </div>
              
              <div className="space-y-8 sm:space-y-10 relative">
                <div className="space-y-4">
                  <label className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Operation Mode</label>
                  <div className="relative group/select">
                    <select 
                      className="w-full h-10 xs:h-12 sm:h-14 px-4 xs:px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-black/40 border-2 border-white/5 text-white text-[9px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                      value={mode} 
                      onChange={(e) => setMode(e.target.value as any)}
                    >
                      <option value="classic">Classic Objective</option>
                      <option value="team">Tactical Squads</option>
                      <option value="survival">Last Stand (Survival)</option>
                      <option value="sprint">Velocity Sprint</option>
                      <option value="cafe">Enterprise (Cafe)</option>
                    </select>
                    <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40 group-hover/select:text-primary transition-colors">
                      <span className="material-symbols-outlined text-sm xs:text-base">expand_more</span>
                    </div>
                  </div>
                </div>

                {mode === "survival" && (
                  <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <label className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Vitality Units (Lives)</label>
                    <div className="relative">
                      <input 
                        className="w-full h-10 xs:h-12 sm:h-14 px-4 xs:px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-black/40 border-2 border-white/5 text-white text-sm xs:text-base sm:text-lg font-black outline-none focus:border-primary/50 transition-all"
                        type="number" min={1} max={9} 
                        value={livesPerPlayer} 
                        onChange={(e) => setLivesPerPlayer(Number(e.target.value))} 
                      />
                      <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-primary/20">
                        <span className="material-symbols-outlined text-sm xs:text-base">favorite</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between ml-2">
                    <label className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Security Protocols</label>
                    <span className="text-[7px] sm:text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">Active</span>
                  </div>
                  <div className="space-y-4">
                    <div className="relative group/select">
                      <select 
                        className="w-full h-10 xs:h-12 sm:h-14 px-4 xs:px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-black/40 border-2 border-white/5 text-white text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "none") setBannedWordsStr("");
                          else if (val === "moderate") setBannedWordsStr("badword,offensive,swear");
                          else if (val === "strict") setBannedWordsStr("badword,offensive,swear,trash,stupid,dumb,idiot");
                        }}
                      >
                        <option value="">Encryption Presets</option>
                        <option value="none">Open Channel</option>
                        <option value="moderate">Encrypted</option>
                        <option value="strict">Ultra-Secure</option>
                      </select>
                      <div className="absolute right-4 xs:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
                        <span className="material-symbols-outlined text-sm xs:text-base">shield</span>
                      </div>
                    </div>
                    <textarea 
                      className="w-full p-4 xs:p-6 rounded-2xl xs:rounded-[2rem] bg-black/20 border-2 border-white/5 text-white text-[10px] xs:text-[11px] font-medium outline-none h-32 xs:h-40 resize-none focus:border-primary/40 transition-all placeholder:text-white/10"
                      value={bannedWordsStr} 
                      onChange={(e) => setBannedWordsStr(e.target.value)} 
                      placeholder="Input restricted terminology (comma-separated)..."
                    />
                  </div>
                </div>

                <button 
                  className="w-full py-4 xs:py-5 bg-white/5 border-2 border-white/10 text-white rounded-2xl xs:rounded-3xl font-black text-[10px] xs:text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white/20 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group/btn"
                  onClick={applySettings}
                >
                  <span className="material-symbols-outlined text-primary text-base xs:text-lg group-hover/btn:rotate-180 transition-transform duration-700">refresh</span>
                  Update Protocols
                </button>
              </div>
            </div>

            {mode === "cafe" && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-3xl border-2 border-amber-500/20 rounded-[2.5rem] xs:rounded-[3.5rem] p-6 xs:p-8 sm:p-10 shadow-[0_30px_60px_rgba(245,158,11,0.1)] relative overflow-hidden group/cafe">
                <div className="absolute -top-24 -left-24 size-64 bg-amber-500/10 blur-[100px] rounded-full group-hover/cafe:bg-amber-500/20 transition-colors duration-1000"></div>
                
                <div className="flex items-center justify-between mb-8 xs:mb-10 relative">
                  <div className="flex items-center gap-4">
                    <div className="size-8 xs:size-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <span className="material-symbols-outlined text-amber-500 text-lg xs:text-xl">storefront</span>
                    </div>
                    <h3 className="text-[11px] xs:text-sm font-black text-amber-500 uppercase tracking-[0.3em]">Business Intel</h3>
                  </div>
                  <div className="size-2 rounded-full bg-amber-500 animate-pulse"></div>
                </div>

                <div className="space-y-8 xs:space-y-10 relative">
                  <div className="flex justify-between items-end">
                    <div className="space-y-2">
                      <div className="text-[8px] xs:text-[9px] font-black text-amber-500/60 uppercase tracking-[0.4em] ml-1">Aggregate Revenue</div>
                      <div className="text-4xl xs:text-6xl font-black text-white tabular-nums tracking-tighter">${cafeMoney.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="space-y-4 xs:space-y-5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[8px] xs:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Active Pipeline</span>
                      <span className="text-[9px] xs:text-[10px] font-black text-amber-500 uppercase tracking-widest">{cafeCustomers.length} Entities</span>
                    </div>
                    <div className="w-full h-3 xs:h-4 bg-black/40 rounded-full p-0.5 xs:p-1 border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000 relative shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                        style={{ width: `${Math.min((cafeCustomers.length) * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
                        <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 xs:gap-6 pt-6 border-t border-white/10">
                    <div className="space-y-1 xs:space-y-1.5">
                      <div className="text-[7px] xs:text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] xs:tracking-[0.4em]">Efficiency</div>
                      <div className="text-lg xs:text-xl font-black text-white">98.4%</div>
                    </div>
                    <div className="space-y-1 xs:space-y-1.5">
                      <div className="text-[7px] xs:text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] xs:tracking-[0.4em]">Growth</div>
                      <div className="text-lg xs:text-xl font-black text-emerald-500">+$2.4k/s</div>
                    </div>
                  </div>

                  <div className="pt-6 xs:pt-8 border-t border-white/10 space-y-3 xs:space-y-4">
                    <div className="text-[8px] xs:text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] xs:tracking-[0.4em] ml-1">Live Feed</div>
                    <div className="space-y-2 xs:space-y-3">
                      {cafeCustomers.slice(-3).map((c, i) => (
                        <div key={i} className="group/entity relative p-3 xs:p-4 rounded-xl xs:rounded-2xl bg-black/30 border border-white/5 flex justify-between items-center transition-all hover:border-amber-500/30">
                          <div className="flex items-center gap-2 xs:gap-3">
                            <div className="size-7 xs:size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-[9px] xs:text-[10px]">
                              #{c.id.slice(0, 3)}
                            </div>
                            <span className="text-[9px] xs:text-[10px] font-bold text-white uppercase tracking-widest">Entity</span>
                          </div>
                          <span className="text-[8px] xs:text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md">
                            {c.servedBy ? `Served` : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation - Floating Bar */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-8 py-10 border-t border-white/10 relative">
          <button 
            className="group/footer w-full sm:w-auto flex items-center justify-center gap-4 px-10 py-6 bg-white/[0.03] border-2 border-white/5 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white/[0.08] hover:border-white/20 transition-all active:scale-95"
            onClick={() => setHostScreen(HostScreen.QuestionEditor)}
          >
            <span className="material-symbols-outlined text-2xl group-hover/footer:rotate-12 transition-transform">edit_square</span>
            Suspend & Reconfigure
          </button>
          
          <div className="hidden md:flex items-center gap-3 opacity-20 group">
            <div className="size-1.5 rounded-full bg-white group-hover:scale-150 transition-transform"></div>
            <div className="size-1.5 rounded-full bg-white group-hover:scale-150 transition-transform delay-75"></div>
            <div className="size-1.5 rounded-full bg-white group-hover:scale-150 transition-transform delay-150"></div>
          </div>

          <button 
            className="group/footer w-full sm:w-auto flex items-center justify-center gap-5 px-12 py-6 bg-primary text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:brightness-110 transition-all shadow-[0_25px_50px_rgba(var(--primary-rgb),0.3)] active:scale-95"
            onClick={() => setHostScreen(HostScreen.Leaderboard)}
          >
            Conclude Session
            <span className="material-symbols-outlined text-2xl group-hover/footer:translate-x-2 transition-transform">military_tech</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface LeaderboardScreenProps {
  setHostScreen: (screen: HostScreen) => void;
  leaderboard: { nickname: string; score: number; streak: number; sphereId?: string }[];
  mode: "classic" | "team" | "survival" | "sprint" | "cafe";
  teamLeaderboard: { name: string; score: number; size: number }[] | undefined;
}

function LeaderboardScreen({ setHostScreen, leaderboard, mode, teamLeaderboard }: LeaderboardScreenProps) {
  return (
    <div className="max-w-4xl mx-auto py-8 xs:py-12 sm:py-16 px-4 xs:px-6 sm:px-8">
      <div className="text-center mb-10 xs:mb-16 space-y-3 xs:space-y-4">
        <div className="inline-flex items-center gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] xs:text-xs font-bold tracking-[0.2em] uppercase">
          <span className="material-symbols-outlined text-xs xs:text-sm">emoji_events</span>
          Final Proclamation
        </div>
        <h2 className="text-3xl xs:text-5xl sm:text-6xl font-black tracking-tight text-white">Grand Standings</h2>
        <p className="text-slate-400 text-sm xs:text-base sm:text-lg max-w-xl mx-auto font-light italic px-4">
          "Excellence is not an act, but a habit." — Aristotle
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xs:gap-12">
        {mode === "team" && teamLeaderboard && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 xs:p-8 sm:p-10 rounded-2xl xs:rounded-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 xs:p-8 opacity-5">
              <span className="material-symbols-outlined text-6xl xs:text-8xl">diversity_3</span>
            </div>
            <h3 className="text-[10px] xs:text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6 xs:mb-8 flex items-center gap-3 relative z-10">
              <span className="material-symbols-outlined text-primary text-base xs:text-lg">groups</span>
              Team Performance
            </h3>
            <div className="space-y-3 xs:space-y-4 relative z-10">
              {teamLeaderboard.map((t, i) => (
                <div key={i} className="flex items-center p-4 xs:p-6 rounded-xl xs:rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                  <div className={`size-8 xs:size-10 rounded-lg xs:rounded-xl flex items-center justify-center font-black mr-4 xs:mr-6 text-sm xs:text-base ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-slate-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-base xs:text-xl uppercase tracking-wider truncate">{t.name}</div>
                    <div className="text-[8px] xs:text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.size} Active Members</div>
                  </div>
                  <div className="text-xl xs:text-3xl font-black text-primary drop-shadow-lg ml-2">{t.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 xs:p-8 sm:p-10 rounded-2xl xs:rounded-3xl shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 xs:p-8 opacity-5">
            <span className="material-symbols-outlined text-6xl xs:text-8xl">person</span>
          </div>
          <h3 className="text-[10px] xs:text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6 xs:mb-8 flex items-center gap-3 relative z-10">
            <span className="material-symbols-outlined text-primary text-base xs:text-lg">stars</span>
            Individual Merit
          </h3>
          <div className="space-y-4 xs:space-y-6 relative z-10">
            {leaderboard.map((p, i) => {
              const sphere = SPHERES.find(s => s.id === p.sphereId) || SPHERES[0];
              return (
                <div key={i} className={`flex items-center p-4 xs:p-6 sm:p-8 rounded-2xl xs:rounded-3xl transition-all relative overflow-hidden ${i === 0 ? 'bg-primary/10 border-2 border-primary/40 xs:scale-[1.02] shadow-2xl shadow-primary/20' : 'bg-white/[0.02] border border-white/5'}`}>
                  {i === 0 && <div className="absolute top-0 left-0 w-full h-0.5 xs:h-1 bg-gradient-to-r from-yellow-500 to-transparent"></div>}
                  <div className={`size-10 xs:size-12 sm:size-14 rounded-xl xs:rounded-2xl flex items-center justify-center font-black mr-4 xs:mr-6 sm:mr-8 text-base xs:text-lg sm:text-xl shrink-0 ${i === 0 ? 'bg-yellow-500 text-black shadow-xl shadow-yellow-500/20' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-600 text-black' : 'bg-white/10 text-slate-400'}`}>
                    {i + 1}
                  </div>
                  <div className="size-10 xs:size-12 sm:size-14 rounded-xl xs:rounded-2xl bg-white/5 flex items-center justify-center text-xl xs:text-2xl sm:text-3xl border border-white/10 mr-4 xs:mr-6 shrink-0">
                    {sphere.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg xs:text-xl sm:text-2xl font-black text-white tracking-tight truncate">{p.nickname}</div>
                    <div className="flex flex-wrap items-center gap-2 xs:gap-3 text-[8px] xs:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5 xs:mt-1">
                      <span className="hidden xs:inline">Performance Rating</span>
                      <span className="hidden xs:block size-1 rounded-full bg-slate-700"></span>
                      <span className="text-primary whitespace-nowrap">🔥 Streak: {p.streak}</span>
                    </div>
                  </div>
                  <div className="text-2xl xs:text-3xl sm:text-4xl font-black text-white ml-2">{p.score}</div>
                </div>
              );
            })}
            {leaderboard.length === 0 && (
              <div className="py-16 xs:py-24 text-center space-y-4 xs:space-y-6">
                <div className="size-16 xs:size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                  <span className="material-symbols-outlined text-3xl xs:text-4xl">cloud_off</span>
                </div>
                <p className="text-sm xs:text-base text-slate-500 font-bold italic px-4">No performance data retrieved for this session.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 xs:mt-16 flex flex-col sm:flex-row justify-between items-center gap-4 xs:gap-6">
        <button 
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 xs:px-10 py-4 xs:py-5 bg-white/5 border border-white/10 text-white rounded-xl xs:rounded-2xl font-bold text-sm xs:text-base hover:bg-white/10 transition-all active:scale-95"
          onClick={() => setHostScreen(HostScreen.LiveGame)}
        >
          <span className="material-symbols-outlined text-lg xs:text-xl">arrow_back</span>
          Return to Command
        </button>
        <button 
          className="w-full sm:w-auto px-12 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl shadow-primary/30"
          onClick={() => setHostScreen(HostScreen.SetSelection)}
        >
          Initialize New Session
        </button>
      </div>
    </div>
  );
}



function ModToggle({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between group/mod cursor-pointer" onClick={onToggle}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/mod:text-white transition-colors">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${active ? 'bg-red-500' : 'bg-white/10'}`}>
        <div className={`absolute top-1 left-1 size-3 rounded-full bg-white transition-all duration-300 ${active ? 'translate-x-5 shadow-lg shadow-red-500/50' : ''}`}></div>
      </div>
    </div>
  );
}

function Player({ setHomeView, selectedSphereId, modMenuUnlocked, addCoins }: { 
  setHomeView: () => void, 
  selectedSphereId: string,
  modMenuUnlocked: boolean,
  addCoins: (amount: number) => void
}) {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const selectedSphere = SPHERES.find(s => s.id === selectedSphereId) || SPHERES[0];

  // Mod Menu State
  const [showModMenu, setShowModMenu] = useState(false);
  const [autoAnswer, setAutoAnswer] = useState(false);
  const [highlightCorrect, setHighlightCorrect] = useState(false);
  const [removeWrong, setRemoveWrong] = useState(false);

  const [baseUrl, setBaseUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      // If we're on the Vite dev port, assume the server is on 4000
      if (window.location.port === '5173') {
        return `${protocol}//${window.location.hostname}:4000`;
      }
      return `${protocol}//${window.location.host}`;
    }
    return "";
  });
  const socket = useMemo(() => createSocket(baseUrl), [baseUrl]);

  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [status, setStatus] = useState("lobby");
  const [qIndex, setQIndex] = useState(-1);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ nickname: string; score: number; streak: number; sphereId?: string }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correctIndex: number } | null>(null);
  const [myLives, setMyLives] = useState<number | undefined>(undefined);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{ 
    mode: "classic" | "team" | "survival" | "sprint" | "cafe" | "td"; 
    teams: string[]; 
    livesPerPlayer?: number;
    cafeInfo?: Record<string, { money: number; customersServed: number; stock: Record<string, number>; upgrades: Record<string, number>; customers: { id: string; item: string }[] }>;
    tdInfo?: Record<string, { tokens: number; health: number; wave: number; towers: any[] }>;
  } | null>(null);
  const [joined, setJoined] = useState(false);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    // Game PIN is alphanumeric now (A-Z, 2-9)
    value = value.toUpperCase();
    if (value.length > 1) value = value[value.length - 1];
    
    // Alphanumeric check (A-Z, 2-9, excluding 0, 1, I, O to match server's alphabet)
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    if (value && !alphabet.includes(value)) return;

    const newCodeArr = code.padEnd(6, " ").split("");
    newCodeArr[index] = value;
    const finalCode = newCodeArr.join("").trimEnd();
    setCode(finalCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  React.useEffect(() => {
    function onStateUpdate(s: any) {
      setStatus(s.status);
      setQIndex(s.qIndex);
      setLeaderboard(s.leaderboard);
      setActivePowerUp(null); // Clear powerup on status change

      // Reward logic when game ends
      if (s.status === "leaderboard") {
        const myResult = s.leaderboard.findIndex((p: any) => p.nickname === nickname);
        if (myResult !== -1) {
          let reward = 10; // Participation
          if (myResult === 0) reward += 100;
          else if (myResult === 1) reward += 75;
          else if (myResult === 2) reward += 50;
          addCoins(reward);
        }
      }

      if (s.survivalInfo && socket.id) {
        const info = s.survivalInfo[socket.id];
        setMyLives(info?.lives);
      } else {
        setMyLives(s.myLives);
      }
      if (s.status === "question") {
        setSelected(null);
        setResult(null);
      }
    }
    function onQuestion(q: { index: number; prompt: string; choices: Choice[]; timeLimitSec: number; correctIndex?: number }) {
      setCurrentQ({ prompt: q.prompt, choices: q.choices, correctIndex: q.correctIndex ?? -1, timeLimitSec: q.timeLimitSec });
      setSelected(null);
      setResult(null);

      // Mod Menu: Auto Answer
      if (autoAnswer && q.correctIndex !== undefined) {
        setTimeout(() => {
          answer(q.correctIndex!);
        }, 1000 + Math.random() * 2000);
      }
    }
    function onQuestionResults(res: { index: number; correctIndex: number; answers: Record<string, number> }) {
      setResult({ correctIndex: res.correctIndex });
    }
    function onRoomInfo(info: any) {
      setRoomInfo(info);
    }
    function onError(message: string) {
      setError(message);
      setJoined(false);
    }
    function onEnded() {
      setStatus("ended");
    }
    function onFrozen({ duration }: { duration: number }) {
      setIsFrozen(true);
      setTimeout(() => setIsFrozen(false), duration);
    }

    socket.on("state:update", onStateUpdate);
    socket.on("game:question", onQuestion);
    socket.on("game:questionResults", onQuestionResults);
    socket.on("player:roomInfo", onRoomInfo);
    socket.on("player:error", onError);
    socket.on("game:ended", onEnded);
    socket.on("player:frozen", onFrozen);

    return () => {
      socket.off("state:update", onStateUpdate);
      socket.off("game:question", onQuestion);
      socket.off("game:questionResults", onQuestionResults);
      socket.off("player:roomInfo", onRoomInfo);
      socket.off("player:error", onError);
      socket.off("game:ended", onEnded);
      socket.off("player:frozen", onFrozen);
    };
  }, [socket, nickname, autoAnswer]);

  function joinRoom() {
    if (code.length < 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    if (!nickname) {
      setError("Please enter a nickname");
      return;
    }
    setError(null);
    socket.emit("player:join", { code, nickname, teamName, sphereId: selectedSphere.id }, (res: { ok: boolean; reason?: string }) => {
      if (res.ok) {
        setJoined(true);
      } else {
        setError(res.reason || "Failed to join");
      }
    });
  }

  function answer(index: number) {
    if (selected !== null || status !== "question" || isFrozen) return;
    setSelected(index);
    socket.emit("player:answer", { code, choiceIndex: index });
  }

  const usePowerUp = (id: string) => {
    if (powerUpInventory[id] > 0 && !activePowerUp) {
      const newInv = { ...powerUpInventory };
      newInv[id]--;
      setPowerUpInventory(newInv);
      localStorage.setItem("qs_powerups", JSON.stringify(newInv));
      setActivePowerUp(id);
      
      // Emit powerup usage to server
      socket.emit("player:usePowerUp", { code, powerUpId: id });

      // Power-up duration (e.g., 10 seconds)
      setTimeout(() => setActivePowerUp(null), 10000);
    }
  };

  if (!joined) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-white font-serif antialiased">
      {/* Subtle Abstract Background Pattern */}
      <div className="absolute inset-0 bg-pattern pointer-events-none opacity-50"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Mod Menu Toggle */}
      {modMenuUnlocked && (
        <div className="fixed top-6 right-6 z-[100]">
          <button 
            onClick={() => setShowModMenu(!showModMenu)}
            className={`size-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-2xl ${
              showModMenu 
                ? 'bg-red-500 border-red-500 text-white rotate-90 scale-110 shadow-red-500/40' 
                : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 hover:scale-110 shadow-red-500/20'
            }`}
          >
            <span className={`material-symbols-outlined text-3xl ${!showModMenu ? 'animate-spin-slow' : ''}`}>
              {showModMenu ? 'close' : 'settings_suggest'}
            </span>
          </button>
          
          {showModMenu && (
            <div className="absolute top-20 right-0 w-72 bg-slate-950/90 backdrop-blur-2xl border border-red-500/20 p-8 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] space-y-8 animate-in zoom-in-95 fade-in duration-300">
              <div className="flex items-center justify-between border-b border-red-500/10 pb-6">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">System Override</span>
                </div>
                <span className="text-[8px] font-mono text-red-500/50">v4.0.2-ALPHA</span>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Automation Modules</label>
                  <ModToggle label="Omniscience" active={autoAnswer} onToggle={() => setAutoAnswer(!autoAnswer)} />
                  <ModToggle label="Luminous Path" active={highlightCorrect} onToggle={() => setHighlightCorrect(!highlightCorrect)} />
                  <ModToggle label="Neural Filter" active={removeWrong} onToggle={() => setRemoveWrong(!removeWrong)} />
                </div>

                <div className="pt-4 space-y-3">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Currency Injection</label>
                  <button 
                    onClick={() => addCoins(1000)}
                    className="w-full py-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all flex items-center justify-center gap-3 group/inject"
                  >
                    <span className="material-symbols-outlined text-lg group-hover/inject:rotate-180 transition-transform duration-500">currency_exchange</span>
                    Inject 1K Credits
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-[9px] font-mono text-red-400/60 leading-relaxed">
                      &gt; root@qs-terminal: Connection secured.
                      <br />
                      &gt; Modifiers active.
                    </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="layout-container flex grow flex-col z-10">
          {/* Top Navigation */}
          <header className="flex items-center justify-between px-8 py-6 lg:px-20">
            <div className="flex items-center gap-2 group cursor-pointer transition-all duration-300 hover:opacity-80" onClick={setHomeView}>
              <span className="material-symbols-outlined text-white text-sm">arrow_back_ios</span>
              <span className="text-white text-sm font-medium leading-normal">Back to Home</span>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="size-6 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em] hidden sm:block">QuizSphere</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 rounded-full size-10 border border-primary/30 flex items-center justify-center text-xl">
                {selectedSphere.emoji}
              </div>
            </div>
          </header>

          {/* Central Content Container */}
          <main className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-[480px] flex flex-col gap-8">
              {/* Headline Section */}
              <div className="text-center space-y-2">
                <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
                  {selectedSphere.emoji}
                </div>
                <h1 className="text-white tracking-tight text-4xl lg:text-5xl font-bold leading-tight">Enter Game Code</h1>
                <p className="text-[#92a4c9] text-base font-normal leading-normal">Selected Character: {selectedSphere.name}</p>
              </div>

              {/* Input Section */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-30 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col gap-8 relative z-10">
                  {/* Nickname Input */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity Signature</label>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${nickname.length > 0 ? 'text-primary' : 'text-slate-600'}`}>
                        {nickname.length}/15
                      </span>
                    </div>
                    <div className="relative group">
                      <input 
                        className="w-full h-16 px-6 rounded-2xl bg-background-dark/30 border-2 border-white/5 text-white placeholder:text-slate-600 focus:border-primary/50 focus:bg-primary/5 transition-all outline-none font-bold text-lg shadow-inner"
                        placeholder="Enter your nickname"
                        value={nickname}
                        maxLength={15}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className={`size-1.5 rounded-full transition-all duration-500 ${nickname.length > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></div>
                        <span className="material-symbols-outlined text-slate-600 group-focus-within:text-primary transition-colors">fingerprint</span>
                      </div>
                    </div>
                  </div>

                  {/* 6-digit code inputs */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 text-center block">Transmission Frequency</label>
                    <div className="flex justify-center">
                      <fieldset className="relative flex gap-2 sm:gap-4 items-center">
                        {[0, 1, 2].map((i) => (
                          <input
                            key={i}
                            ref={(el) => (inputRefs.current[i] = el)}
                            className="code-input flex h-14 w-10 sm:h-18 sm:w-14 text-center rounded-2xl bg-background-dark/30 border-2 border-white/5 text-white text-3xl font-black focus:border-primary focus:bg-primary/5 focus:ring-0 transition-all outline-none placeholder:text-slate-800 shadow-inner"
                            maxLength={1}
                            placeholder="•"
                            type="text"
                            value={code[i] || ""}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                          />
                        ))}
                        {/* Visual Divider */}
                        <div className="flex flex-col gap-1 px-1">
                          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse delay-75"></div>
                        </div>
                        {[3, 4, 5].map((i) => (
                          <input
                            key={i}
                            ref={(el) => (inputRefs.current[i] = el)}
                            className="code-input flex h-14 w-10 sm:h-18 sm:w-14 text-center rounded-2xl bg-background-dark/30 border-2 border-white/5 text-white text-3xl font-black focus:border-primary focus:bg-primary/5 focus:ring-0 transition-all outline-none placeholder:text-slate-800 shadow-inner"
                            maxLength={1}
                            placeholder="•"
                            type="text"
                            value={code[i] || ""}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                          />
                        ))}
                      </fieldset>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
                      <p className="text-red-400 text-xs font-bold tracking-tight">{error}</p>
                    </div>
                  )}

                  {/* Join Button */}
                  <div className="flex justify-center pt-2">
                    <button 
                      onClick={joinRoom}
                      className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-16 bg-primary text-white text-lg font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10 flex items-center gap-3">
                        Initialize Join
                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">rocket_launch</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta Text / Footer Links */}
              <div className="flex flex-col items-center gap-4">
                <p className="text-[#92a4c9] text-sm font-normal">
                  Don't have a code? <a className="text-primary hover:underline font-medium" href="#">Browse public games</a>
                </p>
              </div>
            </div>
          </main>

          {/* Bottom Spacer for desktop centering */}
          <footer className="py-10 text-center">
            <p className="text-white/20 text-xs font-sans tracking-widest uppercase">Professional Assessment Suite • v2.6.0</p>
          </footer>
        </div>
      </div>
    );
  }

  // Game View
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-white font-serif antialiased">
      <div className="absolute inset-0 bg-pattern pointer-events-none opacity-50"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="layout-container flex h-full grow flex-col z-10 overflow-y-auto custom-scrollbar">
        {/* Power-up Effects Overlay */}
        {isFrozen && (
          <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-blue-400/20 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 border-[20px] border-blue-400/30 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 text-center animate-in zoom-in duration-300">
                <span className="material-symbols-outlined text-8xl text-blue-300 animate-spin-slow">ac_unit</span>
                <h2 className="text-4xl font-black text-white mt-4 uppercase tracking-tighter">You are Frozen!</h2>
                <p className="text-blue-100 font-bold opacity-80">Wait for the ice to melt...</p>
              </div>
            </div>
            {/* Ice shards */}
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="absolute bg-blue-200/40 w-4 h-12 rounded-full rotate-45 animate-pulse"
                style={{ 
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>
        )}

        {activePowerUp === "double_points" && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 duration-500">
            <div className="bg-amber-500 text-white px-6 py-2 rounded-full font-black flex items-center gap-2 shadow-2xl shadow-amber-500/40">
              <span className="material-symbols-outlined animate-bounce">rocket_launch</span>
              2X MULTIPLIER ACTIVE
            </div>
          </div>
        )}

        {activePowerUp === "shield" && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 duration-500">
            <div className="bg-blue-500 text-white px-6 py-2 rounded-full font-black flex items-center gap-2 shadow-2xl shadow-blue-500/40">
              <span className="material-symbols-outlined animate-pulse">shield</span>
              SHIELD ACTIVE
            </div>
          </div>
        )}

        <header className="flex items-center justify-between px-8 py-6 lg:px-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold border border-primary/30">
                {nickname[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <h2 className="text-white text-lg font-bold leading-tight">{nickname}</h2>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                  <p className="text-[#92a4c9] text-xs font-medium uppercase tracking-wider">{status}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {myLives !== undefined && (
              <div className="flex gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                {[...Array(roomInfo?.livesPerPlayer || 3)].map((_, i) => (
                  <span key={i} className={`material-symbols-outlined text-xl transition-all duration-500 ${i < (myLives || 0) ? 'text-red-500 fill-red-500' : 'text-white/10'}`}>
                    favorite
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <span className="material-symbols-outlined text-primary text-xl">qr_code_2</span>
              <span className="text-white font-black tracking-widest font-sans">{code}</span>
            </div>
          </div>
        </header>

        {/* Power-up Dock */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] flex gap-4 p-4 bg-background-dark/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl scale-110">
          {Object.entries(powerUpInventory).map(([id, count]) => {
            if (count === 0) return null;
            const pu = POWER_UPS.find(p => p.id === id);
            if (!pu) return null;
            const isActive = activePowerUp === id;
            return (
              <button
                key={id}
                onClick={() => usePowerUp(id)}
                disabled={!!activePowerUp}
                className={`group relative size-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary ring-4 ring-primary/40 scale-110' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95'
                }`}
              >
                <span className={`material-symbols-outlined text-3xl ${isActive ? 'text-white animate-pulse' : 'text-primary'}`}>
                  {pu.icon}
                </span>
                <div className="absolute -top-2 -right-2 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-background-dark">
                  {count}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-background-dark border border-white/10 px-3 py-2 rounded-xl text-center whitespace-nowrap shadow-2xl">
                    <p className="text-white text-xs font-bold">{pu.name}</p>
                    <p className="text-primary text-[10px] font-black uppercase tracking-widest">{pu.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <main className="flex-1 px-4 py-12 pb-32">
          <div className="w-full max-w-4xl mx-auto min-h-full flex flex-col justify-center">
            {roomInfo?.mode === "td" && status !== "lobby" && status !== "ended" ? (
              <TDPlayerView 
                td={roomInfo.tdInfo?.[socket.id] || { tokens: 0, health: 10, wave: 1, towers: [] }}
                code={code}
                socket={socket}
                status={status}
                currentQ={currentQ}
                qIndex={qIndex}
                selected={selected}
                answer={answer}
              />
            ) : roomInfo?.mode === "cafe" && status !== "lobby" && status !== "ended" ? (
              <CafePlayerView 
                cafe={roomInfo.cafeInfo?.[socket.id] || { money: 0, customersServed: 0, stock: { "toast": 0 }, upgrades: { "multiplier": 1 } }}
                players={roomInfo.players || {}}
                code={code}
                socket={socket}
                status={status}
                currentQ={currentQ}
                qIndex={qIndex}
                selected={selected}
                answer={answer}
              />
            ) : status === "lobby" && (
              <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="relative inline-block">
                  <div className="size-32 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-6xl text-primary">hourglass_empty</span>
                  </div>
                  <div className="absolute -top-2 -right-2 size-8 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce">
                    !
                  </div>
                </div>
                <div className="space-y-4">
                  <h1 className="text-white tracking-tight text-5xl lg:text-6xl font-black leading-tight">Waiting for Host</h1>
                  <p className="text-[#92a4c9] text-xl font-normal leading-normal max-w-xl mx-auto">
                    The session will begin as soon as the host starts the game. Get ready for an intense learning session!
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="size-3 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
            )}

            {roomInfo?.mode !== "cafe" && status === "question" && currentQ && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-[0.2em] uppercase">
                    <span className="material-symbols-outlined text-sm">quiz</span>
                    Question {qIndex + 1}
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight max-w-3xl mx-auto">
                    {currentQ.prompt}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentQ.choices.map((c, i) => {
                    const isCorrect = i === currentQ.correctIndex;
                    const isWrong = !isCorrect && selected !== null && selected !== i;
                    const shouldHighlight = highlightCorrect && status === "question" && isCorrect;
                    const shouldRemove = removeWrong && status === "question" && !isCorrect && i % 2 === 0; // Remove half of wrong answers

                    if (shouldRemove) return null;

                    return (
                      <button
                        key={i}
                        disabled={selected !== null}
                        onClick={() => answer(i)}
                        className={`
                          group relative overflow-hidden p-8 rounded-2xl border-2 text-left transition-all duration-300
                          ${selected === i 
                            ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/40 scale-[0.98]' 
                            : shouldHighlight
                              ? 'bg-green-500/20 border-green-500/50 text-green-500 shadow-lg shadow-green-500/10 scale-[1.02]'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-primary/50 hover:bg-white/10 hover:scale-[1.02]'}
                          ${selected !== null && selected !== i ? 'opacity-40 grayscale-[0.5]' : ''}
                        `}
                      >
                        <div className="flex items-center gap-6 relative z-10">
                          <div className={`
                            size-12 rounded-xl flex items-center justify-center font-black text-xl transition-colors
                            ${selected === i ? 'bg-white/20 text-white' : shouldHighlight ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}
                          `}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="text-xl font-bold">{c.text}</span>
                        </div>
                        {(selected === i || shouldHighlight) && (
                          <div className="absolute top-0 right-0 p-4">
                            <span className={`material-symbols-outlined text-white/20 text-6xl ${shouldHighlight ? 'text-green-500/20' : ''}`}>
                              {shouldHighlight ? 'auto_awesome' : 'check_circle'}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {roomInfo?.mode !== "cafe" && status === "results" && (
              <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                {result ? (
                  <>
                    <div className={`
                      size-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-700
                      ${selected === result.correctIndex 
                        ? 'bg-green-500/20 text-green-500 shadow-green-500/20' 
                        : 'bg-red-500/20 text-red-500 shadow-red-500/20'}
                    `}>
                      <span className="material-symbols-outlined text-7xl">
                        {selected === result.correctIndex ? 'verified' : 'error'}
                      </span>
                    </div>
                    <div className="space-y-4">
                      <h3 className={`text-6xl lg:text-7xl font-black tracking-tighter ${selected === result.correctIndex ? 'text-green-500' : 'text-red-500'}`}>
                        {selected === result.correctIndex ? 'EXCELLENT!' : 'NOT QUITE...'}
                      </h3>
                      <p className="text-[#92a4c9] text-xl font-normal leading-normal max-w-xl mx-auto">
                        {selected === result.correctIndex 
                          ? "You've mastered this concept. Stay sharp for the next challenge!" 
                          : "Every mistake is a learning opportunity. You'll get the next one!"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    <div className="size-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[#92a4c9] text-xl font-medium animate-pulse">Calculating results...</p>
                  </div>
                )}
              </div>
            )}

            {status === "ended" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="text-center space-y-4">
                  <div className="size-24 bg-yellow-500/20 text-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-12 shadow-2xl shadow-yellow-500/10">
                    <span className="material-symbols-outlined text-6xl">emoji_events</span>
                  </div>
                  <h1 className="text-white tracking-tight text-5xl lg:text-6xl font-black leading-tight">Game Complete</h1>
                  <p className="text-[#92a4c9] text-xl font-normal">Final Standings & Performance Review</p>
                </div>

                <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                  {leaderboard.map((p, i) => {
                    const isMe = p.nickname === nickname;
                    const sphere = SPHERES.find(s => s.id === p.sphereId) || SPHERES[0];
                    return (
                      <div 
                        key={i} 
                        className={`
                          flex items-center gap-6 p-6 rounded-2xl border transition-all duration-500
                          ${isMe ? 'bg-primary border-primary shadow-2xl shadow-primary/30 scale-[1.05] z-20' : 'bg-white/5 border-white/10'}
                          ${i === 0 && !isMe ? 'border-yellow-500/30 bg-yellow-500/5' : ''}
                        `}
                      >
                        <div className={`
                          size-12 rounded-xl flex items-center justify-center font-black text-xl
                          ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-orange-500 text-black' : 'bg-white/10 text-white'}
                        `}>
                          {i + 1}
                        </div>
                        <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                          {sphere.emoji}
                        </div>
                        <div className="flex-1">
                          <div className={`text-xl font-bold ${isMe ? 'text-white' : 'text-slate-200'}`}>
                            {p.nickname} {isMe && '(You)'}
                          </div>
                          <div className={`text-sm ${isMe ? 'text-white/70' : 'text-slate-500'}`}>
                            Performance Index • 🔥 {p.streak || 0} Streak
                          </div>
                        </div>
                        <div className={`text-2xl font-black ${isMe ? 'text-white' : 'text-primary'}`}>
                          {p.score} <span className="text-xs uppercase tracking-widest opacity-50 ml-1">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center pt-8">
                  <button 
                    onClick={() => window.location.reload()}
                    className="group flex items-center gap-3 px-12 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 hover:translate-y-[-4px] transition-all"
                  >
                    <span className="material-symbols-outlined">home</span>
                    Return to Lobby
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="py-10 text-center shrink-0">
          <p className="text-white/20 text-xs font-sans tracking-widest uppercase">Professional Assessment Suite • v2.6.0</p>
        </footer>
      </div>
    </div>
  );
}
