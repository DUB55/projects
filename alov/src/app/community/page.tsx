"use client"

import { Navbar } from "@/components/navbar"
import { motion } from "framer-motion"
import { 
  Users, 
  Github, 
  Twitter, 
  MessageCircle, 
  Globe, 
  Sparkles,
  ArrowUpRight,
  Heart
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function CommunityPage() {
  return (
    <div className="relative min-h-screen selection:bg-primary/30 text-foreground">
      <div className="page-bg fixed inset-0 z-0">
        <div className="gradient-blob subpage-gradient" />
      </div>
      <Navbar />
      
      <main className="relative z-10 pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <header className="text-center space-y-6 mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20"
          >
            <Users className="w-3.5 h-3.5" /> Aether Community
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
            Built by creators, <br />
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">for creators.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Join thousands of developers and designers building the future of software with autonomous AI.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <CommunityCard 
            icon={<MessageCircle className="w-8 h-8 text-[#5865F2]" />}
            title="Discord"
            description="The heart of our community. Get real-time help, share your projects, and hang out with the team."
            stats="12,400+ members"
            link="https://discord.com"
            color="discord"
          />
          <CommunityCard 
            icon={<Github className="w-8 h-8 text-slate-900 dark:text-white" />}
            title="GitHub"
            description="Contribute to the Aether ecosystem, report bugs, and explore our open-source repositories."
            stats="4.8k stars"
            link="https://github.com"
            color="github"
          />
          <CommunityCard 
            icon={<Twitter className="w-8 h-8 text-[#1DA1F2]" />}
            title="X / Twitter"
            description="Stay updated with the latest features, tips, and community highlights."
            stats="25k followers"
            link="https://twitter.com"
            color="twitter"
          />
          <CommunityCard 
            icon={<Globe className="w-8 h-8 text-emerald-500" />}
            title="Showcase"
            description="Browse amazing applications built by our community and get inspired."
            stats="1,200+ apps"
            link="/showcase"
            color="showcase"
          />
        </div>

        <section className="liquid-glass rounded-[40px] p-12 text-center border border-slate-200/50 dark:border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Heart className="w-32 h-32 text-primary" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Become an Ambassador</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Are you passionate about Aether? Join our ambassador program to get early access to features, exclusive swag, and more.
            </p>
            <button className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-primary/20">
              Apply Now
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function CommunityCard({ icon, title, description, stats, link, color }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  stats: string;
  link: string;
  color: string;
}) {
  return (
    <motion.a
      href={link}
      target={link.startsWith('http') ? "_blank" : "_self"}
      rel="noopener noreferrer"
      whileHover={{ y: -4 }}
      className="liquid-glass p-8 rounded-[32px] border border-slate-200/50 dark:border-white/10 hover:dark:bg-white/[0.05] transition-all group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 space-y-3">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-white/5">
        <span className="text-sm font-bold text-primary">{stats}</span>
      </div>
    </motion.a>
  )
}
