"use client"

import { Navbar } from "@/components/navbar"
import { motion } from "framer-motion"
import { 
  Book, 
  Code2, 
  Cpu, 
  Layers, 
  Rocket, 
  Shield, 
  Zap,
  ChevronRight,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function DocsPage() {
  return (
    <div className="relative min-h-screen selection:bg-primary/30 text-foreground">
      <div className="page-bg fixed inset-0 z-0">
        <div className="gradient-blob subpage-gradient" />
      </div>
      <Navbar />
      
      <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 space-y-8 shrink-0">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">Getting Started</h4>
              <nav className="space-y-1">
                <SidebarItem label="Introduction" active />
                <SidebarItem label="Quickstart" />
                <SidebarItem label="Architecture" />
                <SidebarItem label="Deployment" />
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">Core Concepts</h4>
              <nav className="space-y-1">
                <SidebarItem label="Autonomous Agents" />
                <SidebarItem label="Liquid Glass UI" />
                <SidebarItem label="WebContainers" />
                <SidebarItem label="Prompt Engineering" />
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-12">
            <header className="space-y-4">
              <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider">
                <Book className="w-4 h-4" /> Documentation
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">Introduction to Aether</h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                Learn how Aether transforms your ideas into production-ready software using autonomous multi-agent orchestration.
              </p>
            </header>

            <div className="grid sm:grid-cols-2 gap-6">
              <DocCard 
                icon={<Rocket className="w-6 h-6 text-blue-500" />}
                title="Quickstart"
                description="Go from zero to a deployed application in under 5 minutes."
              />
              <DocCard 
                icon={<Code2 className="w-6 h-6 text-purple-500" />}
                title="API Reference"
                description="Explore the Aether API and build custom integrations."
              />
              <DocCard 
                icon={<Layers className="w-6 h-6 text-pink-500" />}
                title="Component Library"
                description="Discover our pre-built Liquid Glass components."
              />
              <DocCard 
                icon={<Shield className="w-6 h-6 text-emerald-500" />}
                title="Security"
                description="Learn about our data privacy and security protocols."
              />
            </div>

            <article className="prose dark:prose-invert max-w-none space-y-8">
              <section className="liquid-glass rounded-3xl p-8 border border-slate-200/50 dark:border-white/10">
                <h2 className="text-2xl font-bold mb-4">What is Aether?</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Aether is a next-generation development platform powered by autonomous AI agents. 
                  Unlike traditional IDEs, Aether understands your intent, designs the architecture, 
                  writes the code, and handles the deployment—all within a secure, browser-based environment.
                </p>
                <div className="mt-8 flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <Zap className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium text-primary">Aether is currently in public beta. Expect rapid updates!</p>
                </div>
              </section>
            </article>
          </div>
        </div>
      </main>
    </div>
  )
}

function SidebarItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all group",
      active 
        ? "bg-primary/10 text-primary" 
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
    )}>
      {label}
      {active && <ChevronRight className="w-4 h-4" />}
    </button>
  )
}

function DocCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="liquid-glass p-6 rounded-[24px] border border-slate-200/50 dark:border-white/10 hover:dark:bg-white/[0.05] transition-all cursor-pointer group"
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}
