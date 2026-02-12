"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  MessageSquare, 
  Layout, 
  ChevronRight, 
  FileText, 
  Folder, 
  Search, 
  Settings2,
  Brain,
  ArrowUp,
  Loader2,
  CheckCircle2,
  Rocket,
  Shield,
  Zap,
  ChevronDown,
  Upload,
  Globe,
  Code2,
  Sparkles,
  ZapOff,
  ClipboardList,
  Monitor,
  Cloud,
  Layers,
  History,
  Gauge,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Mic,
  Share2,
  Github,
  Moon,
  Sun,
  MoreHorizontal,
  Pause,
  ChevronUp,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Navbar } from "@/components/navbar"
import { cn } from "@/lib/utils"
import { storage, Project } from "@/lib/storage"
import { useRouter } from "next/navigation"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

type Message = {
  role: "user" | "assistant" | "system"
  content: string
}

interface TreeNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: TreeNode[]
}

export default function HomePage() {
  const router = useRouter()
  const [showApp, setShowApp] = useState(false)
  const [gradientTheme, setGradientTheme] = useState<'blue' | 'pink' | 'emerald' | 'sunset' | 'sea' | 'purple' | 'midnight' | 'amber'>('blue')
  const [executionMode, setExecutionMode] = useState<'plan' | 'fast'>('fast')
  const [streamingText, setStreamingText] = useState("")
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)

  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [showModal, setShowModal] = useState<{ title: string, content: string } | null>(null)
  
  // Editor state
  const [activeTab, setActiveTab] = useState<'chat' | 'terminal'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [codeView, setCodeView] = useState<'preview' | 'code'>('preview')
  const [rightView, setRightView] = useState<'preview' | 'explorer'>('preview')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [buildProgress, setBuildProgress] = useState<{ status: string, percent: number } | null>(null)
  const [published, setPublished] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("about:blank")
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [fileLanguage, setFileLanguage] = useState("typescript")
  const [showChat, setShowChat] = useState(true)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, streamingText])

  useEffect(() => {
    const loadRecent = async () => {
      const projects = await storage.getAllProjects()
      setRecentProjects(projects.slice(0, 3))
    }
    loadRecent()
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('aether-gradient-theme') as any
    const validThemes = ['blue', 'pink', 'emerald', 'sunset', 'sea', 'purple', 'midnight', 'amber']
    if (savedTheme && validThemes.includes(savedTheme)) {
      setGradientTheme(savedTheme)
      document.documentElement.setAttribute('data-gradient-theme', savedTheme)
    }
  }, [])

  const handleGradientChange = (theme: 'blue' | 'pink' | 'emerald' | 'sunset' | 'sea' | 'purple' | 'midnight' | 'amber') => {
    setGradientTheme(theme)
    localStorage.setItem('aether-gradient-theme', theme)
    document.documentElement.setAttribute('data-gradient-theme', theme)
    const landingBg = document.querySelector('.landing-bg')
    if (landingBg) {
      const validThemes = ['blue', 'pink', 'emerald', 'sunset', 'sea', 'purple', 'midnight', 'amber']
      validThemes.forEach(t => landingBg.classList.remove(`gradient-${t}`))
      landingBg.classList.add(`gradient-${theme}`)
    }
  }

  const handleStartProject = async (prompt: string) => {
    const id = Math.random().toString(36).substring(7)
    const newProject: Project = {
      id,
      name: prompt.slice(0, 30) || "Untitled Project",
      lastModified: Date.now(),
      files: {}, // Start with empty files
      chatHistory: [{ role: "user", content: prompt }]
    }
    await storage.saveProject(newProject)
    console.log("[Landing] CreatedProject", { id, name: newProject.name, prompt })
    router.push(`/editor/${id}`)
  }

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    setBusy(true)
    console.log("[Landing] StartProject", { prompt: trimmed })
    handleStartProject(trimmed)
    setInput("")
  }

  const handleSelectNode = async (node: TreeNode) => {
    if (node.type !== "file") return
    setSelectedPath(node.path)
    const response = await fetch(`/api/explorer?path=${encodeURIComponent(node.path)}`)
    const data = await response.json()
    if (data?.type === "file") {
      setFileContent(data.content ?? "")
      const ext = node.name.split(".").pop() ?? ""
      setFileLanguage(ext || "text")
    }
  }

  const handleSaveFile = async (content: string) => {
    if (!selectedPath) return
    try {
      const res = await fetch("/api/explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedPath, content })
      })
      if (res.ok) {
        setFileContent(content)
        // Refresh tree to show new files if any
        const treeRes = await fetch("/api/explorer?depth=2")
        const treeData = await treeRes.json()
        setTree(treeData.tree)
      }
    } catch (error) {
      console.error("Failed to save file:", error)
    }
  }

  const handlePublish = async () => {
    setBusy(true)
    setRightView("preview")
    setPreviewLoading(true)
    
    // Simulate Deployment Build
    setBuildProgress({ status: "Preparing production build...", percent: 10 })
    await new Promise(r => setTimeout(r, 800))
    setBuildProgress({ status: "Optimizing assets...", percent: 40 })
    await new Promise(r => setTimeout(r, 1200))
    setBuildProgress({ status: "Uploading to Vercel...", percent: 75 })
    await new Promise(r => setTimeout(r, 1500))
    setBuildProgress({ status: "Finalizing deployment...", percent: 90 })
    await new Promise(r => setTimeout(r, 1000))
    
    setBuildProgress(null)
    setPublished(true)
    setBusy(false)
    setPreviewLoading(false)
    alert("App published successfully! Your project is now live at https://aether-app.vercel.app")
  }

  const handleRefreshPreview = () => {
    setPreviewLoading(true)
    const currentUrl = previewUrl
    setPreviewUrl("about:blank")
    setTimeout(() => setPreviewUrl(currentUrl), 50)
  }

  const renderTree = (node: TreeNode) => {
    const isFile = node.type === "file"
    return (
      <div key={node.path} className="w-full">
        {isFile ? (
          <button
            onClick={() => handleSelectNode(node)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/50",
              selectedPath === node.path && "bg-accent text-accent-foreground"
            )}
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
          </button>
        ) : (
          <details className="group" open>
            <summary className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50">
              <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
              <Folder className="w-4 h-4 text-primary/60" />
              <span className="font-medium truncate">{node.name}</span>
            </summary>
            <div className="ml-4 mt-1 space-y-1 border-l border-border/50 pl-2">
              {node.children?.map((child) => renderTree(child))}
            </div>
          </details>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "relative min-h-screen selection:bg-primary/30 transition-colors duration-500 text-foreground",
      showApp ? "bg-background" : "bg-transparent"
    )}>
      <AnimatePresence mode="wait">
        {!showApp ? (
          <div key="landing-wrapper" className="w-full relative min-h-screen">
            <div 
              suppressHydrationWarning
              className={cn(
                "landing-bg",
                `gradient-${gradientTheme}`
              )} 
            />
            <Navbar />
            <motion.main
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20"
            >
              {/* Landing content remains same */}
              <div className="max-w-4xl w-full text-center space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[13px] font-semibold border border-slate-200/50 dark:border-white/5"
                >
                  <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider">Beta</span>
                  Aether is now in public preview →
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="text-6xl md:text-[84px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-6"
                >
                  Build the future <br />
                  <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">with Aether</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-[18px] md:text-[22px] font-normal text-slate-700/80 dark:text-slate-300/80 max-w-2xl mx-auto tracking-normal leading-relaxed mb-4"
                >
                  The first autonomous platform that transforms your vision into production-ready software. Fast, free, and infinite.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="max-w-3xl mx-auto mt-10"
                >
                  <form onSubmit={sendMessage} className="relative flex flex-col liquid-glass rounded-[32px] p-6 shadow-2xl focus-within:ring-0 dark:bg-white/[0.08] dark:border-white/[0.15] dark:backdrop-blur-3xl group transition-all duration-500 hover:dark:bg-white/[0.12] hover:dark:border-white/[0.2]">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Describe the application you want to build..."
                      className="w-full h-36 bg-transparent border-none focus:ring-0 text-[20px] font-medium resize-none placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none text-slate-800 dark:text-white leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button 
                            type="button" 
                            disabled={busy}
                            className="text-slate-400 dark:text-white/40 p-2 rounded-full cursor-pointer hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-6 h-6 stroke-[2.5px]" />
                          </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2 bg-white dark:bg-[#1a1a1a]/90 border-slate-200/60 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-3xl liquid-glass" align="start">
                            <div className="flex flex-col gap-1">
                              <button className="flex items-center gap-3 w-full p-2.5 rounded-xl text-left group cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Upload className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Upload Files</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Add context to your project</div>
                                </div>
                              </button>
                              <button className="flex items-center gap-3 w-full p-2.5 rounded-xl text-left group cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                  <Globe className="w-4 h-4 text-purple-500" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Import URL</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Extract content from a website</div>
                                </div>
                              </button>
                              <button className="flex items-center gap-3 w-full p-2.5 rounded-xl text-left group cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                  <Code2 className="w-4 h-4 text-pink-500" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Code Snippet</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Paste raw code directly</div>
                                </div>
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="flex bg-slate-100/80 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 backdrop-blur-sm gap-0.5">
                          {[
                            { id: 'blue', color: 'from-blue-400 to-purple-500', title: 'Blue' },
                            { id: 'pink', color: 'from-pink-400 to-orange-400', title: 'Pink' },
                            { id: 'emerald', color: 'from-emerald-400 to-teal-500', title: 'Emerald' },
                            { id: 'sunset', color: 'from-orange-500 to-rose-500', title: 'Sunset' },
                            { id: 'sea', color: 'from-cyan-400 to-blue-600', title: 'Sea' },
                            { id: 'purple', color: 'from-violet-500 to-fuchsia-500', title: 'Purple' },
                            { id: 'midnight', color: 'from-slate-700 to-slate-900', title: 'Midnight' },
                            { id: 'amber', color: 'from-amber-400 to-yellow-600', title: 'Amber' },
                          ].map((theme) => (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => handleGradientChange(theme.id as any)}
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                gradientTheme === theme.id 
                                  ? "bg-white dark:bg-white/10 shadow-sm ring-1 ring-slate-200 dark:ring-white/20" 
                                  : "opacity-40 hover:opacity-100"
                              )}
                              title={`${theme.title} Gradient`}
                            >
                              <div className={cn("w-3.5 h-3.5 rounded-full bg-gradient-to-br", theme.color)} />
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                              type="button" 
                              disabled={busy}
                              className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white/80 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {executionMode === 'plan' ? (
                                  <><ClipboardList className="w-4 h-4" /> Plan</>
                                ) : (
                                  <><Zap className="w-4 h-4" /> Fast</>
                                )}
                                <ChevronDown className="w-3 h-3 opacity-50" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 p-1.5 bg-white dark:bg-[#1a1a1a]/95 border-slate-200/60 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-3xl" align="end">
                              <DropdownMenuItem 
                                onClick={() => setExecutionMode('plan')}
                                className={cn(
                                  "flex flex-col items-start gap-0.5 p-3 cursor-pointer rounded-xl transition-colors",
                                  executionMode === 'plan' ? "bg-slate-200 dark:bg-white/10" : "hover:bg-slate-200 dark:hover:bg-white/5"
                                )}
                              >
                                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                                  <ClipboardList className="w-4 h-4 text-primary" /> Plan
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">AI creates a structured plan before executing</div>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setExecutionMode('fast')}
                                className={cn(
                                  "flex flex-col items-start gap-0.5 p-3 cursor-pointer rounded-xl mt-1 transition-colors",
                                  executionMode === 'fast' ? "bg-slate-200 dark:bg-white/10" : "hover:bg-slate-200 dark:hover:bg-white/5"
                                )}
                              >
                                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                                  <Zap className="w-4 h-4 text-amber-500" /> Fast
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">AI immediately executes without planning</div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <button 
                            type="submit" 
                            className={cn(
                              "bg-slate-100 dark:bg-[#333333] text-slate-500 dark:text-slate-400 rounded-full w-11 h-11 flex items-center justify-center cursor-pointer",
                              (input.trim() || busy) && "bg-[#111] dark:bg-white text-white dark:text-black"
                            )}
                            disabled={!input.trim() || busy}
                          >
                            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5 stroke-[3px]" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {recentProjects.length > 0 && (
                    <div className="mt-12 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Projects</h3>
                        <button 
                          onClick={() => router.push('/projects')}
                          className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                          View all projects <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recentProjects.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => router.push(`/editor/${p.id}`)}
                            className="flex flex-col items-start p-4 rounded-2xl liquid-glass text-left group border border-transparent cursor-pointer hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className="text-sm font-bold truncate w-full mb-1">{p.name}</div>
                            <div className="text-[11px] text-slate-500">Modified {new Date(p.lastModified).toLocaleDateString()}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.main>

            {/* Scrollable Info Section */}
            <section className="max-w-6xl mx-auto px-6 py-32 space-y-32">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid md:grid-cols-3 gap-12"
              >
                <div 
                  onClick={() => setShowModal({
                    title: "Instant Deployment",
                    content: "Aether AI leverages a high-speed multi-agent orchestration layer that allows your code to be containerized and deployed instantly. Every change you make is built in real-time, ensuring a seamless transition from idea to live application. Our infrastructure automatically handles SSL certificates, domain management, and edge caching, so your site is globally available and lightning-fast from the moment you hit deploy."
                  })}
                  className="space-y-4 p-8 rounded-[2rem] liquid-glass cursor-pointer border border-transparent hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Instant Deployment</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Watch your ideas come to life in seconds with our high-speed multi-agent orchestration.</p>
                </div>
                <div 
                  onClick={() => setShowModal({
                    title: "Advanced Models",
                    content: "Our platform is model-agnostic, supporting the latest large language models (LLMs) including GPT-4o, Claude 3.5 Sonnet, and specialized local models via Ollama. We use the best tool for the job to ensure high-quality code generation. By leveraging a mixture of experts (MoE) approach, Aether can intelligently route complex architecture tasks to more capable models while using faster, efficient models for routine code updates and refactoring."
                  })}
                  className="space-y-4 p-8 rounded-[2rem] liquid-glass cursor-pointer border border-transparent hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Advanced Models</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Powered by the latest LLMs, from local small models to the world&apos;s most capable cloud AI.</p>
                </div>
                <div 
                  onClick={() => setShowModal({
                    title: "100% Private & Secure",
                    content: "Your privacy is our top priority. Aether AI can run entirely on your local machine, meaning your source code and data never leave your computer. For cloud-based tasks, we use encrypted routing and zero-retention policies to ensure your intellectual property remains yours. We support end-to-end encryption for all project data and offer enterprise-grade security features, including SOC2 compliance and detailed audit logs for team collaboration."
                  })}
                  className="space-y-4 p-8 rounded-[2rem] liquid-glass cursor-pointer border border-transparent hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">100% Private</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Run everything locally for maximum security, or use our secure cloud routing for extra power.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-slate-500/10 via-slate-600/10 to-slate-700/10 border border-white/10 p-12 text-center liquid-glass"
              >
                <div className="max-w-2xl mx-auto space-y-6">
                  <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Ready to start building?</h2>
                  <p className="text-slate-600 dark:text-slate-300">Join thousands of creators who are already building the future of the web with Aether.</p>
                  <Button 
                    onClick={() => handleStartProject("New Application")}
                    className="bg-slate-900 dark:bg-white text-white dark:text-black rounded-full px-8 py-6 text-lg font-bold shadow-xl active:scale-[0.98] hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                  >
                    Launch Aether Editor
                  </Button>
                </div>
              </motion.div>
            </section>

            <AnimatePresence>
              {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowModal(null)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl"
                  >
                    <button 
                      onClick={() => setShowModal(null)}
                      className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <h3 className="text-3xl font-bold text-white mb-6">{showModal.title}</h3>
                    <p className="text-slate-300 leading-relaxed text-xl">{showModal.content}</p>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            
            <footer className="py-12 px-6 border-t border-white/10 text-center text-slate-500 text-sm">
              <p>© 2026 Aether AI. Built for the future web.</p>
            </footer>
          </div>
        ) : (
          <motion.main
            key="app"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-screen pt-16 bg-[#252525] overflow-hidden"
          >
            {/* 30% Left: Chat/Terminal Interface */}
            <AnimatePresence>
              {showChat && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "30%", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-r border-white/10 bg-[#252525] flex flex-col relative overflow-hidden"
                >
                  <div className="flex items-center border-b border-white/5 bg-[#252525]">
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                        activeTab === 'chat' 
                          ? "border-white text-white bg-white/5" 
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      )}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setActiveTab('terminal')}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                        activeTab === 'terminal' 
                          ? "border-white text-white bg-white/5" 
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      )}
                    >
                      Terminal
                    </button>
                  </div>

                  {activeTab === 'chat' ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                      {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">No messages yet</p>
                            <p className="text-xs text-slate-400">Start a conversation with Aether</p>
                          </div>
                        </div>
                      )}
                      {messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex flex-col space-y-2 w-full mb-6",
                            msg.role === 'user' ? "items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-1",
                            msg.role === 'user' ? "text-slate-500" : "text-blue-500"
                          )}>
                            {msg.role === 'user' ? 'User' : 'Aether AI'}
                            {msg.role === 'assistant' && <Sparkles className="w-3 h-3" />}
                          </div>
                          <div className={cn(
                            "rounded-2xl text-[15px] leading-relaxed w-full px-4 py-3",
                            msg.role === 'user' 
                              ? "liquid-glass text-slate-800 dark:text-slate-200" 
                              : "text-slate-300 py-1 whitespace-pre-wrap font-mono"
                          )}>
                            {msg.content}
                          </div>
                        </motion.div>
                      ))}
                      {streamingText && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col space-y-2 w-full mb-6 items-start"
                        >
                          <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-1 text-blue-500">
                            Aether AI <Sparkles className="w-3 h-3 animate-pulse" />
                          </div>
                          <div className="rounded-2xl text-[15px] leading-relaxed w-full text-slate-300 py-1 whitespace-pre-wrap font-mono">
                            {streamingText}
                          </div>
                        </motion.div>
                      )}
                      {busy && (
                        <div className="flex w-full justify-start">
                          <div className="rounded-2xl py-1 text-sm">
                            <div className="flex gap-1.5">
                              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/60 rounded-full animate-bounce-intense" />
                              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/60 rounded-full animate-bounce-intense [animation-delay:0.1s]" />
                              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/60 rounded-full animate-bounce-intense [animation-delay:0.2s]" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-emerald-400 bg-slate-950/50">
                      {terminalOutput.length === 0 ? (
                        <p className="opacity-50 italic">No output yet...</p>
                      ) : (
                        terminalOutput.map((line, i) => (
                          <div key={i} className="mb-1 leading-relaxed">
                            <span className="text-slate-500 mr-2">$</span>
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Chat Input at bottom of 30% pane */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#252525] via-[#252525]/95 to-transparent">
                    <form onSubmit={sendMessage} className="relative group">
                      <div className="absolute -inset-0.5 bg-white/5 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                      <div className="relative flex flex-col bg-[#333333] border border-white/10 rounded-xl p-2 shadow-xl">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Make it more responsive..."
                          className="w-full h-20 bg-transparent border-none focus:ring-0 text-sm resize-none placeholder:text-slate-500 py-2 px-3 text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                        />
                        <div className="flex items-center justify-between px-2 pb-1">
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button 
                            type="submit" 
                            size="icon" 
                            className="h-8 w-8 bg-white text-black hover:bg-slate-200 rounded-lg shadow-lg"
                            disabled={!input.trim() || busy}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 70% Right: Preview & Explorer */}
            <div className={cn(
              "flex flex-col bg-[#252525] transition-all duration-300",
              showChat ? "w-[70%]" : "w-full"
            )}>
              {/* Top Bar with Toggles */}
              <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#252525]">
                <div className="flex items-center gap-4">
                  <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => setCodeView("preview")}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                        codeView === "preview" 
                          ? "bg-white text-black shadow-lg" 
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setCodeView("code")}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                        codeView === "code" 
                          ? "bg-white text-black shadow-lg" 
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      Code
                    </button>
                  </div>
                  {codeView === "preview" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      onClick={handleRefreshPreview}
                      title="Refresh Preview"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn("h-8 transition-colors", showChat ? "text-slate-400" : "text-blue-400 bg-blue-500/10")}
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {showChat ? "Hide Chat" : "Show Chat"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-400 hover:text-white h-8"
                    onClick={() => setRightView(rightView === "preview" ? "explorer" : "preview")}
                  >
                    {rightView === "preview" ? "Open Explorer" : "Close Explorer"}
                  </Button>
                  <Button 
                    size="sm" 
                    className={cn(
                      "h-8 rounded-lg font-bold transition-all",
                      published 
                        ? "bg-green-600 hover:bg-green-500 text-white" 
                        : "bg-white text-black hover:bg-slate-200"
                    )}
                    onClick={handlePublish}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : published ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                    {published ? "Published" : "Publish"}
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {codeView === "preview" ? (
                    <motion.div
                      key="preview-pane"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      {previewLoading && !buildProgress && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#252525]/50 backdrop-blur-sm">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                            <p className="text-slate-400 text-sm animate-pulse">Building your app...</p>
                          </div>
                        </div>
                      )}

                      {buildProgress && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#252525]/90 backdrop-blur-md text-white px-6">
                          <div className="w-full max-w-xs space-y-4 text-center">
                            <div className="flex justify-between items-end mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wider text-white">Build Sync</span>
                              <span className="text-xs font-bold text-slate-400">{buildProgress.percent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-white"
                                initial={{ width: 0 }}
                                animate={{ width: `${buildProgress.percent}%` }}
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                              />
                            </div>
                            <p className="text-sm text-slate-300 font-medium animate-pulse">{buildProgress.status}</p>
                          </div>
                        </div>
                      )}

                      <iframe
                        src={previewUrl}
                        className="w-full h-full bg-white dark:bg-[#252525]"
                        onLoad={() => {
                          if (!buildProgress) setPreviewLoading(false)
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="code-pane"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex"
                    >
                      {rightView === "explorer" && (
                        <div className="w-64 border-r border-white/5 bg-slate-900/50 p-4 overflow-y-auto">
                          <div className="flex items-center gap-2 text-slate-400 mb-4 px-2">
                            <Folder className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Explorer</span>
                          </div>
                          {tree ? renderTree(tree) : (
                            <div className="p-4 text-center text-xs text-slate-500">
                              No files generated yet
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="h-8 bg-slate-900 border-b border-white/5 flex items-center px-4">
                          <span className="text-xs text-slate-500 truncate">
                            {selectedPath || "Select a file to edit"}
                          </span>
                        </div>
                        <div className="flex-1 relative">
                          <MonacoEditor
                            height="100%"
                            language={fileLanguage}
                            theme="vs-dark"
                            value={fileContent}
                            onChange={(value) => setFileContent(value ?? "")}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              padding: { top: 16 },
                              readOnly: false
                            }}
                          />
                          {selectedPath && (
                            <div className="absolute bottom-4 right-4 z-20">
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                                onClick={() => handleSaveFile(fileContent)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  )
}
