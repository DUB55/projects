"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { 
  Folder, 
  Search, 
  ChevronRight, 
  Plus, 
  ArrowLeft,
  Calendar,
  Clock
} from "lucide-react"
import { storage, Project } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { cn } from "@/lib/utils"

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const allProjects = await storage.getAllProjects()
        setProjects(allProjects.sort((a, b) => b.lastModified - a.lastModified))
      } catch (error) {
        console.error("Failed to load projects:", error)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden">
      <Navbar />

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to home
            </button>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Your Projects</h1>
            <p className="text-slate-500 mt-2">Manage and continue building your applications.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-slate-900 dark:group-focus-within:text-white" />
              <input 
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 w-full md:w-64 transition-all"
              />
            </div>
            <button 
              onClick={() => router.push('/')}
              className="bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-[2rem] bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <motion.button
                key={project.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => router.push(`/editor/${project.id}`)}
                className="flex flex-col items-start p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 text-left group relative overflow-hidden transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-4 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-1">
                  {project.name}
                </h3>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    Modified {new Date(project.lastModified).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(project.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 border border-white/5 rounded-[3rem] backdrop-blur-sm">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <Folder className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">No projects found</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                {search ? `We couldn't find any projects matching "${search}"` : "You haven't created any projects yet. Start by creating your first app!"}
              </p>
            </div>
            {!search && (
              <button 
                onClick={() => router.push('/')}
                className="text-slate-900 dark:text-white font-bold hover:underline"
              >
                Create a project now
              </button>
            )}
          </div>
        )}
      </motion.main>
    </div>
  )
}
