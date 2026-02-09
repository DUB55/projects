"use client"

import Link from "next/link"
import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"
import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-500",
      scrolled 
        ? "bg-background/20 backdrop-blur-[60px] border-b border-white/10 dark:border-white/5 py-3" 
        : "bg-transparent border-b border-transparent py-5"
    )}>
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/20" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Aether</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <NavItem label="Documentation" href="/docs" />
          <NavItem label="Community" href="/community" />
          <NavItem label="Changelog" href="/changelog" />
          <NavItem label="Github" href="https://github.com" isExternal />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <ModeToggle />
        <Link href="/login">
          <span className="text-sm font-semibold text-[#111] dark:text-white/70 hover:text-white transition-colors">Log in</span>
        </Link>
        <Link href="/signup">
          <button className="bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white border border-slate-200/50 dark:border-white/10 rounded-xl px-5 py-2 text-sm font-bold shadow-sm backdrop-blur-md transition-all">
            Get started
          </button>
        </Link>
      </div>
    </nav>
  )
}

function NavItem({ label, href = "#", isExternal }: { label: string; href?: string; isExternal?: boolean }) {
  if (isExternal) {
    return (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-[15px] font-semibold text-[#444] dark:text-slate-300/70 hover:text-black dark:hover:text-white transition-colors"
      >
        {label}
      </a>
    )
  }

  return (
    <Link 
      href={href}
      className="flex items-center gap-1 text-[15px] font-semibold text-[#444] dark:text-slate-300/70 hover:text-black dark:hover:text-white transition-colors"
    >
      {label}
    </Link>
  )
}
