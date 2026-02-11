"use client"

import { Navbar } from "@/components/navbar"
import { motion } from "framer-motion"
import { 
  History, 
  Zap, 
  Sparkles, 
  Bug, 
  Star,
  Rocket,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ChangelogPage() {
  const updates = [
    {
      version: "v1.2.0",
      date: "February 9, 2026",
      title: "Liquid Glass Evolution",
      description: "A major overhaul of the UI system, introducing deeper transparency, enhanced blurs, and global scaling optimizations.",
      tags: ["UI/UX", "Performance"],
      type: "major"
    },
    {
      version: "v1.1.5",
      date: "February 5, 2026",
      title: "Autonomous Deployment Core",
      description: "Improved the stability of WebContainer-based deployments and added support for more framework templates.",
      tags: ["Core", "Deployment"],
      type: "feature"
    },
    {
      version: "v1.1.0",
      date: "January 28, 2026",
      title: "Multi-Agent Orchestration",
      description: "Introduced the ability for multiple AI agents to collaborate on complex architectural tasks simultaneously.",
      tags: ["AI", "Architecture"],
      type: "major"
    },
    {
      version: "v1.0.8",
      date: "January 15, 2026",
      title: "Terminal Reliability Fixes",
      description: "Resolved issues with long-running terminal processes and improved command output streaming.",
      tags: ["Bug Fix"],
      type: "fix"
    }
  ]

  return (
    <div className="relative min-h-screen selection:bg-primary/30 text-foreground">
      <div className="page-bg fixed inset-0 z-0">
        <div className="gradient-blob subpage-gradient" />
      </div>
      <Navbar />
      
      <main className="relative z-10 pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <header className="space-y-4 mb-16 text-center">
          <div className="flex items-center justify-center gap-2 text-primary text-sm font-bold uppercase tracking-wider">
            <History className="w-4 h-4" /> Product Updates
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">Changelog</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Follow the journey of Aether as we build the world's first autonomous development platform.
          </p>
        </header>

        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-white/10 before:to-transparent">
          {updates.map((update, idx) => (
            <div key={update.version} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-primary shadow-xl z-10 absolute left-0 md:left-1/2 md:-ml-5 group-hover:scale-125 transition-transform duration-500">
                {update.type === 'major' ? <Sparkles className="w-5 h-5" /> : update.type === 'fix' ? <Bug className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>

              {/* Card */}
              <motion.div 
                initial={{ opacity: 0, x: idx % 2 === 0 ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] liquid-glass p-8 rounded-[32px] border border-slate-200/50 dark:border-white/10 hover:dark:bg-white/[0.05] transition-all ml-16 md:ml-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-primary px-2.5 py-1 bg-primary/10 rounded-lg uppercase tracking-wider">
                    {update.version}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {update.date}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{update.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{update.description}</p>
                <div className="flex flex-wrap gap-2">
                  {update.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 py-1 border border-slate-200 dark:border-white/5 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        <footer className="mt-20 text-center">
          <button className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors group">
            View full version history <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </footer>
      </main>
    </div>
  )
}
