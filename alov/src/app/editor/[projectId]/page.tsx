"use client"

import React, { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  FileText, 
  Search, 
  Settings2,
  Brain,
  ArrowUp,
  Loader2,
  Rocket,
  Shield,
  Zap,
  ChevronDown,
  Globe,
  Code2,
  Sparkles,
  Monitor,
  RotateCcw,
  Share2,
  Github,
  Trash2,
  Book,
  Monitor as MonitorIcon,
  Smartphone,
  Tablet,
  Play,
  Database,
  AlertCircle,
  X,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  History,
  FileCode,
  Folder,
  ChevronRight,
  GitBranch,
  GitPullRequest,
  Cloud,
  MoreVertical,
  Maximize2,
  ArrowUpRight,
  MousePointer2,
  Moon,
  Sun,
  Layout,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { storage, Project } from "@/lib/storage"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
  originalPrompt?: string
}

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface TreeNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: TreeNode[]
}

const devicePresets = [
  { label: "iPhone SE", width: 375, height: 667, type: 'mobile' },
  { label: "iPhone XR", width: 414, height: 896, type: 'mobile' },
  { label: "iPhone 12 Pro", width: 390, height: 844, type: 'mobile' },
  { label: "iPhone 14 Pro Max", width: 430, height: 932, type: 'mobile' },
  { label: "Pixel 7", width: 412, height: 915, type: 'mobile' },
  { label: "Samsung Galaxy S8+", width: 360, height: 740, type: 'mobile' },
  { label: "Samsung Galaxy S20 Ultra", width: 412, height: 915, type: 'mobile' },
  { label: "iPad Mini", width: 768, height: 1024, type: 'tablet' },
  { label: "iPad Air", width: 820, height: 1180, type: 'tablet' },
  { label: "iPad Pro", width: 1024, height: 1366, type: 'tablet' },
  { label: "Surface Pro 7", width: 912, height: 1368, type: 'tablet' },
  { label: "Surface Duo", width: 540, height: 720, type: 'mobile' },
  { label: "Galaxy Z Fold 5", width: 373, height: 912, type: 'mobile' },
  { label: "Asus Zenbook Fold", width: 853, height: 1280, type: 'tablet' },
  { label: "Samsung Galaxy A51/71", width: 412, height: 914, type: 'mobile' },
  { label: "Nest Hub", width: 1024, height: 600, type: 'tablet' },
  { label: "Nest Hub Max", width: 1280, height: 800, type: 'tablet' },
]

export default function EditorPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()
  const { theme } = useTheme()
  
  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'settings' | 'knowledge' | 'history' | 'components' | 'deploy'>('preview')
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [fileSearch, setFileSearch] = useState("")
  const [previewUrl, setPreviewUrl] = useState("about:blank")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile' | 'custom'>('desktop')
  const [customViewport, setCustomViewport] = useState({ width: 375, height: 667 })
  const [urlPath, setUrlPath] = useState("/")
  const [lastMobilePreset, setLastMobilePreset] = useState<typeof devicePresets[0]>(devicePresets[0])
  const [lastError, setLastError] = useState<{ type: 'runtime', message: string, stack?: string } | null>(null)
  const [suggestions, setSuggestions] = useState<{ label: string, icon: React.ReactNode, prompt: string }[]>([])
  const [examplePrompt, setExamplePrompt] = useState("Build a modern landing page for a SaaS product.")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [streamingText, setStreamingText] = useState("")
  const [personality, setPersonality] = useState<string>("coder")

  // Sync personality with localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dub5_personality')
    if (saved) {
      setPersonality(saved)
    } else {
      localStorage.setItem('dub5_personality', 'coder')
      setPersonality('coder')
    }
  }, [])

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const mdToHtml = (s: string) => {
    const lines = s.split(/\r?\n/)
    let html = ""
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (/^\s*\|.*\|\s*$/.test(line)) {
        const rows: string[][] = []
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
          const cells = lines[i]
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map(c => escapeHtml(c.trim()))
          rows.push(cells)
          i++
        }
        if (rows.length > 0) {
          const head = rows[0]
          const body = rows.slice(1)
          html += "<table class=\"min-w-full text-sm\"><thead><tr>"
          head.forEach(c => (html += `<th class="px-3 py-2 text-left font-bold">${c}</th>`))
          html += "</tr></thead><tbody>"
          body.forEach(r => {
            html += "<tr>"
            r.forEach(c => (html += `<td class="px-3 py-2">${c}</td>`))
            html += "</tr>"
          })
          html += "</tbody></table>"
        }
        continue
      }
      if (/^#{1,6}\s+/.test(line)) {
        const level = (line.match(/^#{1,6}/)![0].length)
        const content = escapeHtml(line.replace(/^#{1,6}\s+/, ""))
        html += `<h${level} class="font-bold mt-2 mb-1">${content}</h${level}>`
        i++
        continue
      }
      if (/^\s*[-*]\s+/.test(line)) {
        html += "<ul class=\"list-disc ml-5\">"
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          const item = escapeHtml(lines[i].replace(/^\s*[-*]\s+/, ""))
          html += `<li>${item}</li>`
          i++
        }
        html += "</ul>"
        continue
      }
      const paragraph = escapeHtml(line)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+?)`/g, "<code class=\"px-1 py-0.5 bg-muted rounded\">$1</code>")
      html += `<p class="mb-2">${paragraph}</p>`
      i++
    }
    return html
  }

  const removeCodeBlocks = (s: string) => {
    // Remove structured blocks BEGIN_FILE: ... END_FILE
    return s.replace(/BEGIN_FILE:[\s\S]*?END_FILE/g, "").trim()
  }

  const extractCodeBlocks = (s: string) => {
    const blocks: { path: string; code: string }[] = []
    const re = /BEGIN_FILE:\s*([^\r\n]+)\r?\n([\s\S]*?)END_FILE/g
    let m: RegExpExecArray | null
    while ((m = re.exec(s))) {
      blocks.push({ path: m[1].trim(), code: m[2].trim() })
    }
    return blocks
  }
  const defaultPathForLang = (lang: string) => {
    if (lang === "html") return "index.html"
    if (lang === "css") return "styles.css"
    if (lang === "js" || lang === "javascript") return "script.js"
    if (lang === "ts") return "generated.ts"
    if (lang === "jsx") return "components/GeneratedComponent.jsx"
    if (lang === "tsx") return "components/GeneratedComponent.tsx"
    if (lang === "json") return "data.json"
    if (lang === "md" || lang === "markdown") return "NOTES.md"
    return "generated.txt"
  }
  const findFilePathHint = (text: string, lang: string) => {
    const hintRe = /(filename|file|path)\s*:\s*([^\s]+)\b/gi
    const matches: string[] = []
    let m: RegExpExecArray | null
    while ((m = hintRe.exec(text))) {
      matches.push(m[2])
    }
    const extMap: Record<string, string[]> = {
      html: [".html", ".htm"],
      css: [".css"],
      js: [".js", ".mjs", ".cjs"],
      ts: [".ts"],
      jsx: [".jsx"],
      tsx: [".tsx"],
      json: [".json"],
      md: [".md", ".markdown"]
    }
    const exts = extMap[lang] || []
    for (const p of matches) {
      if (exts.length === 0 || exts.some(e => p.toLowerCase().endsWith(e))) return p
    }
    return ""
  }

  // Pool of 60 unique suggestions
  const suggestionPool = [
    { label: "Add dark mode", icon: <Moon className="w-3 h-3" />, prompt: "Apply a dark theme to the current design." },
    { label: "Add white mode", icon: <Sun className="w-3 h-3" />, prompt: "Apply a light theme to the current design." },
    { label: "Add a navbar", icon: <Layout className="w-3 h-3" />, prompt: "Create a responsive navigation bar at the top." },
    { label: "Improve UI", icon: <Sparkles className="w-3 h-3" />, prompt: "Refine the UI/UX of the current page to make it more professional." },
    { label: "Add a footer", icon: <Layout className="w-3 h-3" />, prompt: "Add a modern footer with links and social icons." },
    { label: "Add hero section", icon: <Zap className="w-3 h-3" />, prompt: "Design a high-impact hero section with a CTA." },
    { label: "Add features grid", icon: <Layout className="w-3 h-3" />, prompt: "Add a grid of features with icons and descriptions." },
    { label: "Add contact form", icon: <FileText className="w-3 h-3" />, prompt: "Create a functional contact form with validation." },
    { label: "Add pricing table", icon: <Database className="w-3 h-3" />, prompt: "Design a clean pricing table with multiple tiers." },
    { label: "Add testimonial", icon: <Sparkles className="w-3 h-3" />, prompt: "Add a slider or grid for user testimonials." },
    { label: "Make responsive", icon: <Monitor className="w-3 h-3" />, prompt: "Optimize the entire page for mobile and tablet views." },
    { label: "Add animations", icon: <Zap className="w-3 h-3" />, prompt: "Add smooth entry and scroll animations to all elements." },
    { label: "Change colors", icon: <Sparkles className="w-3 h-3" />, prompt: "Change the primary color palette to a vibrant blue and purple." },
    { label: "Add login page", icon: <Shield className="w-3 h-3" />, prompt: "Design a modern login page with social auth options." },
    { label: "Add blog section", icon: <FileText className="w-3 h-3" />, prompt: "Create a grid of recent blog posts with images." },
    { label: "Add newsletter", icon: <Zap className="w-3 h-3" />, prompt: "Add a newsletter signup section with a simple input." },
    { label: "Add search bar", icon: <Search className="w-3 h-3" />, prompt: "Add a functional search bar in the header." },
    { label: "Add team section", icon: <Layout className="w-3 h-3" />, prompt: "Add a section showing team members with photos." },
    { label: "Add FAQ section", icon: <CheckCircle2 className="w-3 h-3" />, prompt: "Design an accordion-style FAQ section." },
    { label: "Add stats section", icon: <Zap className="w-3 h-3" />, prompt: "Add a section showing key statistics and numbers." },
    { label: "Add glassmorphism", icon: <Sparkles className="w-3 h-3" />, prompt: "Apply a glassmorphism effect to all cards and containers." },
    { label: "Add gradient text", icon: <Sparkles className="w-3 h-3" />, prompt: "Make all headings use a stylish gradient text effect." },
    { label: "Add button group", icon: <MousePointer2 className="w-3 h-3" />, prompt: "Add a grouped set of buttons for different actions." },
    { label: "Add image gallery", icon: <Layout className="w-3 h-3" />, prompt: "Create a responsive masonry-style image gallery." },
    { label: "Add video player", icon: <Play className="w-3 h-3" />, prompt: "Embed a video player with custom controls." },
    { label: "Add sidebar", icon: <Layout className="w-3 h-3" />, prompt: "Add a collapsible sidebar for navigation." },
    { label: "Add breadcrumbs", icon: <ChevronRight className="w-3 h-3" />, prompt: "Add breadcrumb navigation below the header." },
    { label: "Add progress bar", icon: <Zap className="w-3 h-3" />, prompt: "Add a reading progress bar at the top of the page." },
    { label: "Add cookie banner", icon: <Shield className="w-3 h-3" />, prompt: "Add a GDPR-compliant cookie consent banner." },
    { label: "Add modal window", icon: <ExternalLink className="w-3 h-3" />, prompt: "Add a custom modal popup for notifications." },
    { label: "Add tooltips", icon: <Sparkles className="w-3 h-3" />, prompt: "Add informative tooltips to all interactive elements." },
    { label: "Add pagination", icon: <ChevronRight className="w-3 h-3" />, prompt: "Add pagination controls for large lists." },
    { label: "Add tag cloud", icon: <Zap className="w-3 h-3" />, prompt: "Add a cloud of tags for content categorization." },
    { label: "Add social links", icon: <Github className="w-3 h-3" />, prompt: "Add social media icons with links in the footer." },
    { label: "Add chart/graph", icon: <Database className="w-3 h-3" />, prompt: "Add a visual chart or graph for data display." },
    { label: "Add table grid", icon: <Layout className="w-3 h-3" />, prompt: "Add a data table with sorting and filtering." },
    { label: "Add loading state", icon: <Loader2 className="w-3 h-3" />, prompt: "Add custom loading spinners and skeleton screens." },
    { label: "Add scroll to top", icon: <ArrowUp className="w-3 h-3" />, prompt: "Add a floating button to scroll back to top." },
    { label: "Add notification", icon: <AlertCircle className="w-3 h-3" />, prompt: "Add a toast notification system for alerts." },
    { label: "Add badge/label", icon: <Sparkles className="w-3 h-3" />, prompt: "Add status badges and labels to items." },
    { label: "Add card hover", icon: <Zap className="w-3 h-3" />, prompt: "Add elegant hover effects to all content cards." },
    { label: "Add mega menu", icon: <Layout className="w-3 h-3" />, prompt: "Add a complex mega menu to the navigation." },
    { label: "Add tabs view", icon: <Layout className="w-3 h-3" />, prompt: "Add a tabbed interface for switching content." },
    { label: "Add avatar", icon: <Sparkles className="w-3 h-3" />, prompt: "Add user avatars with status indicators." },
    { label: "Add search modal", icon: <Search className="w-3 h-3" />, prompt: "Add a full-screen search modal with shortcuts." },
    { label: "Add error page", icon: <AlertCircle className="w-3 h-3" />, prompt: "Design a custom 404 error page." },
    { label: "Add coming soon", icon: <Rocket className="w-3 h-3" />, prompt: "Design a high-converting coming soon page." },
    { label: "Add countdown", icon: <Zap className="w-3 h-3" />, prompt: "Add a countdown timer for events or launches." },
    { label: "Add live chat", icon: <Sparkles className="w-3 h-3" />, prompt: "Add a floating live chat widget mockup." },
    { label: "Add audio player", icon: <Play className="w-3 h-3" />, prompt: "Add a minimal audio player for podcasts." },
    { label: "Add dropzone", icon: <PlusCircle className="w-3 h-3" />, prompt: "Add a file upload dropzone area." },
    { label: "Add steps view", icon: <ChevronRight className="w-3 h-3" />, prompt: "Add a step-by-step progress indicator." },
    { label: "Add timeline", icon: <History className="w-3 h-3" />, prompt: "Add a vertical timeline of events." },
    { label: "Add rating stars", icon: <Sparkles className="w-3 h-3" />, prompt: "Add a star rating component for reviews." },
    { label: "Add profile card", icon: <Layout className="w-3 h-3" />, prompt: "Design a modern user profile card." },
    { label: "Add filter bar", icon: <Search className="w-3 h-3" />, prompt: "Add a comprehensive filter bar for products." },
    { label: "Add cart icon", icon: <Rocket className="w-3 h-3" />, prompt: "Add a shopping cart icon with a badge." },
    { label: "Add banner ads", icon: <Zap className="w-3 h-3" />, prompt: "Add promotional banner areas." },
    { label: "Add sticky header", icon: <Layout className="w-3 h-3" />, prompt: "Make the header sticky on scroll." },
    { label: "Add smooth scroll", icon: <Zap className="w-3 h-3" />, prompt: "Enable smooth scrolling for the entire page." }
  ]

  // Pool of 25 project ideas for "Try an example"
  const examplePool = [
    "Build a modern landing page for a SaaS product.",
    "Build a Notion clone with a sidebar and editor.",
    "Build a Netflix clone with movie rows and a hero section.",
    "Build a landing page for a business that sells artisanal coffee.",
    "Build a landing page for a sustainable fashion company called 'EcoThread'.",
    "Build a clone of the Airbnb homepage.",
    "Build a page where users can share posts with each other in a grid.",
    "Build a real-time chat interface with a message list and input.",
    "Build a personal portfolio website with a projects gallery.",
    "Build a dashboard for a crypto tracking application.",
    "Build a recipe app with search and categories.",
    "Build a fitness tracker dashboard with charts and progress.",
    "Build a travel agency landing page with destination cards.",
    "Build a music player interface like Spotify.",
    "Build a job board with search and filters.",
    "Build a weather application with a 5-day forecast.",
    "Build a task management app with drag-and-drop columns.",
    "Build an e-commerce product page with an image gallery and reviews.",
    "Build a news portal with a featured article and side news.",
    "Build a learning management system dashboard.",
    "Build a real estate listing page with property details.",
    "Build a meditation app with audio player and session timer.",
    "Build a restaurant menu page with categories and prices.",
    "Build a event booking landing page with a calendar.",
    "Build a developer tool landing page with code snippets."
  ]

  // Pick random suggestions and an example on mount/refresh
  useEffect(() => {
    const shuffledSuggestions = [...suggestionPool].sort(() => 0.5 - Math.random())
    setSuggestions(shuffledSuggestions.slice(0, 3))
    
    const randomExample = examplePool[Math.floor(Math.random() * examplePool.length)]
    setExamplePrompt(randomExample)
  }, [])
  
  // Integration States
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [isSupabaseTesting, setIsSupabaseTesting] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const [githubRepo, setGithubRepo] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [isGithubPushing, setIsGithubPushing] = useState(false)
  const [githubStatus, setGithubStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [dbTables, setDbTables] = useState<{ name: string, columns: { name: string, type: string }[] }[]>([])

  const addDbTable = () => {
    const name = prompt("Enter table name:")
    if (name) {
      setDbTables([...dbTables, { name, columns: [{ name: "id", type: "uuid" }] }])
      toast.success(`Table '${name}' added to schema.`)
    }
  }
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [aiProgress, setAiProgress] = useState({ status: "", files: [] as string[] })
  const [input, setInput] = useState("")
  
  // Load project on mount
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return
      const p = await storage.getProject(projectId)
      if (p) {
        // Ensure files is at least an empty object
        const projectWithFiles = {
          ...p,
          files: p.files || {}
        }
        setProject(projectWithFiles)
        // Set first file as active if available
        const files = Object.keys(projectWithFiles.files)
        if (files.length > 0 && !activeFile) {
          setActiveFile(files[0])
        }
        // Load settings if they exist
        if (p.settings) {
          setSupabaseUrl(p.settings.supabaseUrl || "")
          setSupabaseKey(p.settings.supabaseKey || "")
          setGithubRepo(p.settings.githubRepo || "")
          setGithubToken(p.settings.githubToken || "")
        }
      } else {
        router.push("/")
      }
    }
    loadProject()
  }, [projectId, router])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [project?.chatHistory, isAIProcessing, streamingText])

  // Save settings when they change
  const saveSettings = async () => {
    if (!project) return
    const updatedProject = {
      ...project,
      settings: {
        supabaseUrl,
        supabaseKey,
        githubRepo,
        githubToken
      }
    }
    setProject(updatedProject)
    await storage.saveProject(updatedProject)
  }

  const handleAIRun = async (predefinedCode?: string) => {
    const currentInput = predefinedCode || input
    if (!currentInput.trim() || !project || isAIProcessing) return
    
    setInput("")
    setIsAIProcessing(true)
    setAiProgress({ status: "Processing request...", files: [] })
    setStreamingText("")
    
    const history = project.chatHistory || []
    const lastMsg = history[history.length - 1]
    const isRetry = !!lastMsg?.isError && lastMsg.originalPrompt === currentInput
    const isLastUserSamePrompt = lastMsg?.role === 'user' && lastMsg?.content === currentInput
    
    // Check if we already have an assistant message responding to this user message
    // to prevent duplication on re-renders or accidental double-calls
    if (lastMsg?.role === 'assistant' && !lastMsg.isError && history[history.length - 2]?.content === currentInput) {
      setIsAIProcessing(false)
      return
    }

    const updatedWithUserMsg = (isRetry || isLastUserSamePrompt)
      ? project
      : { ...project, chatHistory: [...history, { role: 'user', content: currentInput }] }
    
    setProject(updatedWithUserMsg)
    
    let totalAssistantText = ""
    let totalNarrativeText = ""
    let currentFiles = { ...project.files }
    let modifiedFiles: string[] = []
    
    // Shared state for recursion
    let isInsideFile = false
    let currentFilePath = ""

    const runAIRequest = async (promptText: string, isContinuation: boolean = false): Promise<boolean> => {
      try {
        const resp = await fetch("/api/dub5", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            input: promptText, 
            task: "chat", 
            personality: personality,
            params: {}, 
            history: (updatedWithUserMsg.chatHistory || []).slice(Math.max(0, (updatedWithUserMsg.chatHistory || []).length - 8))
          })
        })

        if (!resp.ok || !resp.body) {
          throw new Error(resp.statusText || "Connection failed")
        }

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        
        let chunkBuffer = "" // For resolving partial tags across chunks
        
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          chunkBuffer += chunk
          
          const lines = chunkBuffer.split(/\r?\n/)
          // Keep the last partial line in the buffer
          chunkBuffer = lines.pop() || ""
          
          for (const line of lines) {
            if (!line.startsWith("data:")) continue
            const jsonPart = line.slice(5).trim()
            if (!jsonPart || jsonPart === "[DONE]") continue
            
            try {
              const obj = JSON.parse(jsonPart)
              const content = obj.content || ""
              if (!content) continue

              totalAssistantText += content

              let remaining = content
              while (remaining.length > 0) {
                if (!isInsideFile) {
                  const beginIdx = remaining.indexOf("BEGIN_FILE:")
                  if (beginIdx !== -1) {
                    totalNarrativeText += remaining.slice(0, beginIdx)
                    setStreamingText(totalNarrativeText)
                    
                    const afterBegin = remaining.slice(beginIdx + 11)
                    const lineEnd = afterBegin.indexOf("\n")
                    if (lineEnd !== -1) {
                      currentFilePath = afterBegin.slice(0, lineEnd).trim()
                      isInsideFile = true
                      // Only clear file if it's the start of a fresh response, 
                      // not a continuation of an already open file.
                      if (!isContinuation || !currentFiles[currentFilePath]) {
                        currentFiles[currentFilePath] = ""
                      }
                      if (!modifiedFiles.includes(currentFilePath)) modifiedFiles.push(currentFilePath)
                      remaining = afterBegin.slice(lineEnd + 1)
                    } else {
                      remaining = "" 
                    }
                  } else {
                    totalNarrativeText += remaining
                    setStreamingText(totalNarrativeText)
                    remaining = ""
                  }
                } else {
                  const endIdx = remaining.indexOf("END_FILE")
                  if (endIdx !== -1) {
                    currentFiles[currentFilePath] += remaining.slice(0, endIdx)
                    isInsideFile = false
                    
                    setProject(prev => prev ? { ...prev, files: { ...currentFiles } } : null)
                    if (currentFilePath.endsWith('.html')) setActiveFile(currentFilePath)
                    
                    remaining = remaining.slice(endIdx + 8)
                  } else {
                    currentFiles[currentFilePath] += remaining
                    setProject(prev => prev ? { ...prev, files: { ...currentFiles } } : null)
                    remaining = ""
                  }
                }
              }
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }

        const hasUnclosedFile = isInsideFile || (totalAssistantText.includes("BEGIN_FILE:") && !totalAssistantText.endsWith("END_FILE") && totalAssistantText.lastIndexOf("BEGIN_FILE:") > totalAssistantText.lastIndexOf("END_FILE"))
        
        if (hasUnclosedFile) {
          return await runAIRequest("Continue EXACTLY where you left off/stopped", true)
        }

        return true
      } catch (err) {
        console.error("AI Request Error:", err)
        throw err
      }
    }

    try {
      await runAIRequest(currentInput)
      
      const combinedText = totalAssistantText.trim()
      if (!combinedText) throw new Error("AI response empty.")

      const successMsg: ChatMessage = {
        role: 'assistant',
        content: totalNarrativeText.trim()
      }

      setProject(prev => {
        if (!prev) return null
        const h = prev.chatHistory || []
        // Final guard against repetition: only add if the last message is NOT already this assistant response
        if (h.length > 0 && h[h.length - 1].role === 'assistant' && h[h.length - 1].content === successMsg.content) {
          return prev
        }
        
        const nextChat = (() => {
          if (isRetry && h.length > 0 && h[h.length - 1].isError && h[h.length - 1].originalPrompt === currentInput) {
            return [...h.slice(0, -1), successMsg]
          }
          return [...h, successMsg]
        })()

        const newHistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          description: currentInput || "AI update",
          filesModified: modifiedFiles,
          filesSnapshot: { ...prev.files }
        }

        return {
          ...prev,
          files: currentFiles,
          history: [newHistoryItem, ...(prev.history || [])],
          chatHistory: nextChat,
          lastModified: Date.now()
        }
      })

      // We need to get the final project state to save it, but setProject is async.
      // For now, we rely on the state update above. We'll add a save trigger in a useEffect elsewhere or just save the final object.
      const finalToSave = {
        ...updatedWithUserMsg,
        files: currentFiles,
        chatHistory: (() => {
          const h = updatedWithUserMsg.chatHistory || []
          if (isRetry && h.length > 0 && h[h.length - 1].isError && h[h.length - 1].originalPrompt === currentInput) {
            return [...h.slice(0, -1), successMsg]
          }
          return [...h, successMsg]
        })(),
        lastModified: Date.now()
      }
      await storage.saveProject(finalToSave)
      handleRefreshPreview()
    } catch (err) {
      // Professional error handling
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: "I encountered an unexpected issue while processing your request. Would you like to try again?",
        isError: true,
        originalPrompt: currentInput
      }
      const prevChat = updatedWithUserMsg.chatHistory || []
      const last = prevChat[prevChat.length - 1]
      const nextChat = isRetry && !!last?.isError && last.originalPrompt === currentInput
        ? [...prevChat.slice(0, -1), errorMsg]
        : [...prevChat, errorMsg]
      
      const errorProject = { ...updatedWithUserMsg, chatHistory: nextChat }
      setProject(errorProject)
      await storage.saveProject(errorProject)
    } finally {
      setIsAIProcessing(false)
      setAiProgress({ status: "", files: [] })
      setStreamingText("")
    }
  }

  const [hasAutoRun, setHasAutoRun] = useState(false)
  useEffect(() => {
    if (project && !hasAutoRun && !isAIProcessing) {
      const h = project.chatHistory || []
      if (h.length > 0) {
        const last = h[h.length - 1]
        if (last.role === 'user' && typeof last.content === 'string' && last.content.trim()) {
          setHasAutoRun(true)
          setInput(last.content)
          setTimeout(() => handleAIRun(last.content), 10)
          console.log("[AI] AutoRun", { projectId, lastPrompt: last.content })
        }
      }
    }
  }, [project, hasAutoRun, isAIProcessing])

  const handleRestoreHistory = async (historyId: string) => {
    if (!project || !confirm("Are you sure you want to restore this version? Current changes may be lost.")) return
    
    const tid = toast.loading("Restoring project state...")
    await new Promise(r => setTimeout(r, 1500))
    
    const historyItem = project.history?.find((item: any) => item.id === historyId)
    if (historyItem && historyItem.filesSnapshot) {
      const updatedProject = {
        ...project,
        files: historyItem.filesSnapshot,
        lastModified: Date.now()
      }
      setProject(updatedProject)
      await storage.saveProject(updatedProject)
      toast.success("Project restored to previous state!", { id: tid })
      handleRefreshPreview()
    } else {
      toast.error("Could not find history record or snapshot", { id: tid })
    }
  }

  const handleRefreshPreview = () => {
    if (!project) return
    setPreviewLoading(true)
    
    try {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }

      // 1. Check if urlPath (URL bar) matches a file
      let entryFile = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath
      
      // If empty or index, try common defaults
      if (!entryFile || entryFile === "") entryFile = "index.html"
      
      // If file doesn't exist, fallback to index.html or first HTML
      if (!project.files[entryFile]) {
        entryFile = activeFile?.endsWith('.html') ? activeFile : 'index.html'
        if (!project.files[entryFile]) {
          entryFile = Object.keys(project.files).find(f => f.endsWith('.html')) || ''
        }
      }

      if (entryFile && project.files[entryFile]) {
        let content = project.files[entryFile]
        const blob = new Blob([content], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        // Sync URL bar if it was a fallback
        const displayPath = entryFile.startsWith('/') ? entryFile : `/${entryFile}`
        if (urlPath !== displayPath) setUrlPath(displayPath)
      } else {
        setPreviewUrl("about:blank")
      }
    } catch (err) {
      console.error("Preview refresh failed:", err)
      toast.error("Failed to refresh preview")
    } finally {
      setTimeout(() => setPreviewLoading(false), 500)
    }
  }

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleAutoHeal = async (type: 'runtime', context: string, details: string) => {
    const tid = toast.loading(`AI is analyzing and fixing the ${type} error...`)
    // Simulate AI fixing logic
    await new Promise(r => setTimeout(r, 2500))
    toast.success("Error fixed! Applying changes...", { id: tid })
    setLastError(null)
    handleRefreshPreview()
  }

  const handleTestSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      toast.error("Please enter both Supabase URL and Anon Key")
      return
    }

    setIsSupabaseTesting(true)
    setSupabaseStatus('idle')
    const tid = toast.loading("Testing Supabase connection...")

    try {
      const cleanUrl = supabaseUrl.replace(/\/$/, '')
      const response = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })

      if (response.ok || response.status === 404) { 
        toast.success("Supabase connection verified!", { id: tid })
        setSupabaseStatus('success')
        saveSettings()
      } else {
        throw new Error("Invalid credentials")
      }
    } catch (err) {
      toast.error("Connection failed. Check your URL and Key.", { id: tid })
      setSupabaseStatus('error')
    } finally {
      setIsSupabaseTesting(false)
    }
  }

  const handlePushToGithub = async () => {
    if (!githubRepo || !githubToken) {
      toast.error("Please enter both Repository and Token")
      return
    }

    setIsGithubPushing(true)
    setGithubStatus('idle')
    const tid = toast.loading(`Pushing to ${githubRepo}...`)

    try {
      // Simulate GitHub API push
      await new Promise(r => setTimeout(r, 3000))
      toast.success("Successfully pushed to GitHub!", { id: tid })
      setGithubStatus('success')
      saveSettings()
    } catch (err) {
      toast.error("Failed to push. Check your token and repository.", { id: tid })
      setGithubStatus('error')
    } finally {
      setIsGithubPushing(false)
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success("Editor link copied to clipboard!")
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    const tid = toast.loading("Deploying project...")
    
    try {
      // In a real app, this would call a Vercel/Netlify API
      // For now, we simulate a successful deployment
      await new Promise(r => setTimeout(r, 3000))
      
      toast.success("Your app is now live!", { 
        id: tid,
        description: "Deployment successful"
      })
    } catch (err) {
      toast.error("Deployment failed", { id: tid })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleGenerateDocs = async () => {
    if (!project) return
    setIsGeneratingDocs(true)
    const tid = toast.loading("AI is scanning project files to generate documentation...")
    
    try {
      await new Promise(r => setTimeout(r, 3000))
      
      const fileNames = Object.keys(project.files)
      const projectSummary = `
# Project Documentation: ${project.name}

## Project Overview
This project contains ${fileNames.length} files.

## File Structure
${fileNames.map(f => `- ${f}`).join('\n')}

## Key Components
${fileNames.filter(f => f.endsWith('.tsx') || f.endsWith('.ts')).map(f => `### ${f.split('/').pop()}\nComponent or utility found in ${f}.`).join('\n\n')}

## Generated At
${new Date().toLocaleString()}
      `.trim()
      
      const updatedKnowledge = { 
        ...project.knowledge, 
        "Project Overview": projectSummary,
        "Tech Stack": "Next.js, Tailwind CSS, Lucide Icons, Framer Motion"
      }
      
      const updatedProject = { ...project, knowledge: updatedKnowledge }
      setProject(updatedProject)
      await storage.saveProject(updatedProject)
      
      toast.success("Documentation generated based on project structure!", { id: tid })
    } catch (err) {
      toast.error("Failed to generate documentation")
    } finally {
      setIsGeneratingDocs(false)
    }
  }

  const deleteProject = async () => {
    if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      await storage.deleteProject(projectId)
      router.push("/")
    }
  }

  const saveKnowledge = async (title: string, content: string) => {
    if (!project) return
    const updatedKnowledge = { ...project.knowledge, [title]: content }
    const updatedProject = { ...project, knowledge: updatedKnowledge }
    setProject(updatedProject)
    await storage.saveProject(updatedProject)
  }

  const deleteKnowledge = async (title: string) => {
    if (!project) return
    const updatedKnowledge = { ...project.knowledge }
    delete updatedKnowledge[title]
    const updatedProject = { ...project, knowledge: updatedKnowledge }
    setProject(updatedProject)
    await storage.saveProject(updatedProject)
  }

  const buildFileTree = (files: Record<string, string>): TreeNode[] => {
    const root: TreeNode[] = []
    Object.keys(files).forEach(path => {
      const parts = path.split('/')
      let current = root
      parts.forEach((part, i) => {
        let node = current.find(n => n.name === part)
        if (!node) {
          node = {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            type: i === parts.length - 1 ? "file" : "directory",
            children: i === parts.length - 1 ? undefined : []
          }
          current.push(node)
        }
        if (node.children) current = node.children
      })
    })
    return root
  }

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const handleManualCreateFile = async () => {
    if (!project) return
    const name = prompt("Enter file name (e.g. index.html, styles.css):")
    if (!name) return
    
    const updatedProject = {
      ...project,
      files: {
        ...project.files,
        [name]: name.endsWith('.html') ? "<!DOCTYPE html>\n<html>\n<body>\n  <h1>New File</h1>\n</body>\n</html>" : "// New file"
      },
      lastModified: Date.now()
    }
    setProject(updatedProject)
    await storage.saveProject(updatedProject)
    setActiveFile(name)
    handleRefreshPreview()
    toast.success(`Created ${name}`)
  }

  const handleManualDeleteFile = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!project) return
    
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Trash2 className="w-4 h-4 text-red-500" />
          Delete file {path}?
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toast.dismiss(t)}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={async () => {
              toast.dismiss(t)
              const updatedFiles = { ...project.files }
              delete updatedFiles[path]
              
              const updatedProject = {
                ...project,
                files: updatedFiles,
                lastModified: Date.now()
              }
              setProject(updatedProject)
              await storage.saveProject(updatedProject)
              if (activeFile === path) setActiveFile(null)
              handleRefreshPreview()
              toast.success(`Deleted ${path}`)
            }}
            className="h-8 px-3 text-xs font-bold"
          >
            Delete
          </Button>
        </div>
      </div>
    ), { duration: 5000, position: 'bottom-center' })
  }

  const handleManualDeleteFolder = async (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!project) return
    
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Trash2 className="w-4 h-4 text-red-500" />
          Delete folder {folderPath} and all its contents?
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toast.dismiss(t)}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={async () => {
              toast.dismiss(t)
              const updatedFiles = { ...project.files }
              Object.keys(updatedFiles).forEach(filePath => {
                if (filePath.startsWith(folderPath + '/')) {
                  delete updatedFiles[filePath]
                }
              })
              
              const updatedProject = {
                ...project,
                files: updatedFiles,
                lastModified: Date.now()
              }
              setProject(updatedProject)
              await storage.saveProject(updatedProject)
              
              // If active file was inside the deleted folder, reset it
              if (activeFile?.startsWith(folderPath + '/')) {
                setActiveFile(null)
              }
              
              handleRefreshPreview()
              toast.success(`Deleted folder ${folderPath}`)
            }}
            className="h-8 px-3 text-xs font-bold"
          >
            Delete
          </Button>
        </div>
      </div>
    ), { duration: 5000, position: 'bottom-center' })
  }

  const setDevice = (preset: typeof devicePresets[0] | 'desktop') => {
    if (preset === 'desktop') {
      setPreviewDevice('desktop')
    } else {
      setPreviewDevice(preset.type as any)
      setCustomViewport({ width: preset.width, height: preset.height })
      setLastMobilePreset(preset)
    }
  }

  const toggleDevice = () => {
    if (previewDevice === 'desktop') {
      setDevice(lastMobilePreset)
    } else {
      setDevice('desktop')
    }
  }

  const FileExplorerNode = ({ node }: { node: TreeNode }) => {
    const isFile = node.type === "file"
    const isActive = activeFile === node.path
    const isExpanded = expandedFolders[node.path] ?? true
    
    return (
      <div className="w-full">
        {isFile ? (
          <div className="group flex items-center gap-1">
            <button
              onClick={() => setActiveFile(node.path)}
              className={cn(
                "flex-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all",
                isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <FileCode className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate">{node.name}</span>
            </button>
            <button 
              onClick={(e) => handleManualDeleteFile(node.path, e)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-0.5 group/folder">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleFolder(node.path)}
                className="flex-1 flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest hover:bg-muted/30 rounded-lg transition-colors"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
                <Folder className="w-3.5 h-3.5" />
                <span>{node.name}</span>
              </button>
              <button 
                onClick={(e) => handleManualDeleteFolder(node.path, e)}
                className="opacity-0 group-hover/folder:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="ml-2 border-l border-border/50 pl-2">
                    {node.children?.map(child => (
                      <FileExplorerNode key={child.path} node={child} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-screen bg-background overflow-hidden selection:bg-primary/20">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <div 
            className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 dark:from-slate-200 dark:via-slate-100 dark:to-white shadow-lg shadow-slate-500/20 group-hover:scale-105 transition-all duration-300" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent ml-1">Aether</span>
          </div>
          
          <div className="h-6 w-px bg-border mx-1 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end mr-4">
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-full border border-border/50 liquid-glass h-11 overflow-hidden">
            <TabButton 
              active={activeTab === 'preview'} 
              onClick={() => setActiveTab('preview')}
              icon={<Globe className="w-3.5 h-3.5" />}
              label="Preview"
              xCoord={340}
            />
            <TabButton 
              active={activeTab === 'code'} 
              onClick={() => setActiveTab('code')}
              icon={<Code2 className="w-3.5 h-3.5" />}
              label="Code"
              xCoord={370}
            />
            <TabButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
              icon={<Settings2 className="w-3.5 h-3.5" />}
              label="Settings"
              xCoord={400}
            />
            <TabButton 
              active={activeTab === 'knowledge'} 
              onClick={() => setActiveTab('knowledge')}
              icon={<Brain className="w-3.5 h-3.5" />}
              label="Knowledge"
              xCoord={420}
            />
            <TabButton 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')}
              icon={<History className="w-3.5 h-3.5" />}
              label="History"
              xCoord={480}
            />
            <TabButton 
              active={activeTab === 'deploy'} 
              onClick={() => setActiveTab('deploy')}
              icon={<Rocket className="w-3.5 h-3.5" />}
              label="Deploy"
              xCoord={520}
            />
          </div>

          <div className="h-6 w-px bg-border/50" />

          {/* Custom Size Inputs */}
          <div className="flex items-center gap-1 px-3 py-1 bg-muted/30 rounded-full border border-border/50 liquid-glass h-11">
            <input 
              type="number" 
              value={customViewport.width}
              onChange={(e) => {
                setPreviewDevice('custom')
                setCustomViewport(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))
              }}
              className="w-10 bg-transparent border-none text-[11px] font-bold text-center outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Width"
            />
            <span className="text-[10px] text-muted-foreground font-bold">×</span>
            <input 
              type="number" 
              value={customViewport.height}
              onChange={(e) => {
                setPreviewDevice('custom')
                setCustomViewport(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))
              }}
              className="w-10 bg-transparent border-none text-[11px] font-bold text-center outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Height"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Unified Preview Controller */}
          <div className="flex items-center bg-muted/30 border border-border/50 rounded-full px-3 py-1.5 gap-3 shadow-sm min-w-[320px] liquid-glass h-11">
            <button 
              onClick={toggleDevice}
              className="p-1.5 hover:bg-background/50 rounded-full transition-all text-muted-foreground hover:text-foreground"
            >
              {previewDevice === 'desktop' ? (
                <Monitor className="w-4 h-4" />
              ) : (
                <div className="w-4 h-5 border-2 border-current rounded-[3px] relative">
                  <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-current rounded-full" />
                </div>
              )}
            </button>

            <div className="flex items-center gap-2 flex-1">
              <input 
                type="text" 
                value={urlPath}
                onChange={(e) => {
                  let val = e.target.value
                  if (val && !val.startsWith('/')) val = '/' + val
                  setUrlPath(val)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRefreshPreview()
                  }
                }}
                className="bg-transparent border-none text-xs font-medium w-full outline-none placeholder:text-muted-foreground/30"
                placeholder="/index.html"
              />
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-background/50 rounded-md transition-all text-muted-foreground hover:text-foreground">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-popover border border-border shadow-xl z-[100] opacity-100">
                  <div className="px-2 py-1.5 mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Devices</span>
                  </div>
                  {devicePresets.map((preset) => (
                    <DropdownMenuItem 
                      key={preset.label}
                      onClick={() => setDevice(preset)}
                      className="rounded-xl text-xs font-medium focus:bg-primary/10 focus:text-primary gap-2 cursor-pointer"
                    >
                      {preset.type === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Tablet className="w-3.5 h-3.5" />}
                      {preset.label}
                      <span className="ml-auto text-[10px] text-muted-foreground/60">{preset.width}x{preset.height}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button 
                onClick={handleRefreshPreview}
                className={cn(
                  "p-1.5 hover:bg-background/50 rounded-full transition-all text-muted-foreground hover:text-foreground",
                  previewLoading && "animate-spin-reverse text-primary"
                )}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-border/50" />

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="h-11 px-4 rounded-full text-xs font-bold gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
          <Button 
            size="sm" 
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-11 px-5 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-full gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            Publish
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Chat */}
        <div className="w-[30%] border-r border-border bg-background/50 backdrop-blur-xl flex flex-col z-40 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
            {project?.chatHistory?.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={cn(
                  "flex flex-col gap-2",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "max-w-[90%] p-4 rounded-[1.25rem] text-sm leading-relaxed transition-all",
                  msg.role === 'user' 
                    ? "bg-muted/50 border border-border/50 text-foreground rounded-tr-none liquid-glass shadow-sm hover:shadow-md" 
                    : msg.isError 
                      ? "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-tl-none shadow-sm"
                      : "text-foreground"
                )}>
                  <div dangerouslySetInnerHTML={{ __html: mdToHtml(msg.content || "") }} />
                  {msg.isError && msg.originalPrompt && (
                    <div className="mt-4 pt-4 border-t border-red-500/10 flex items-center justify-between gap-4">
                      <p className="text-[10px] font-medium opacity-70">Would you like to try again?</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setInput(msg.originalPrompt!)
                          setTimeout(() => handleAIRun(), 10)
                        }}
                        className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 gap-2 font-bold text-[10px]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {!!streamingText && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 items-start"
              >
                <div className="max-w-[90%] p-4 rounded-[1.25rem] text-sm leading-relaxed transition-all text-foreground" dangerouslySetInnerHTML={{ __html: mdToHtml(streamingText) }} />
              </motion.div>
            )}
            {isAIProcessing && !streamingText && (
              <div className="flex flex-col gap-2 items-start">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs font-medium text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-background/50 backdrop-blur-md">
            <div className="flex flex-nowrap overflow-x-auto overflow-y-hidden no-scrollbar gap-2 mb-3">
              {suggestions.map((btn) => (
                <button
                  key={btn.label}
                      onClick={() => {
                        handleAIRun(btn.prompt)
                      }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all liquid-glass"
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="relative flex flex-col liquid-glass rounded-[1.5rem] border border-border shadow-lg focus-within:border-primary/50 transition-all bg-muted/20">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAIRun()
                  }
                }}
                placeholder="Message..."
                className="w-full bg-transparent border-none px-4 py-4 pr-12 text-sm outline-none resize-none min-h-[100px] placeholder:text-muted-foreground/50"
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-border/30">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <Globe className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <History className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleAIRun()}
                  disabled={isAIProcessing || !input.trim()}
                  className="w-8 h-8 rounded-xl p-0 bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-3 text-center font-medium">
              Press Enter to send · Shift + Enter for new line
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex overflow-hidden"
          >
            {activeTab === 'preview' && (
              <div className="flex-1 relative flex flex-col items-center p-0 overflow-hidden">
                {/* Ultra-Smooth Mesh Background */}
                <div className="absolute inset-0 bg-slate-50 dark:bg-[#080808] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(120,119,198,0.02),transparent_60%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(120,119,198,0.05),transparent_60%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(120,119,198,0.02),transparent_60%)] dark:bg-[radial-gradient(circle_at_100%_0%,rgba(120,119,198,0.05),transparent_60%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.01),transparent_80%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_80%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(120,119,198,0.03),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_100%,rgba(120,119,198,0.07),transparent_60%)] pointer-events-none" />
                
                {/* Subtle Surface Layer */}
                <div className="absolute inset-0 bg-white/10 dark:bg-black/20 pointer-events-none" />
                
                {/* Preview Container */}
                <div className={cn(
                  "z-10 flex-1 w-full h-full flex flex-col items-center justify-center overflow-hidden transition-all duration-500",
                  previewDevice === 'desktop' ? "p-0" : "p-8"
                )}>
                  <div 
                    style={{ 
                      width: previewDevice === 'desktop' ? '100%' : `${customViewport.width}px`,
                      height: previewDevice === 'desktop' ? '100%' : `${customViewport.height}px`,
                    }}
                    className={cn(
                      "bg-white dark:bg-black shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col relative transition-all duration-500 ease-in-out",
                      previewDevice === 'desktop' ? "w-full h-full rounded-none border-none" : "rounded-[3rem] ring-8 ring-zinc-950 dark:ring-zinc-900 border border-border/50"
                    )}
                  >

                  <div className="flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {previewUrl === "about:blank" && !previewLoading ? (
                      <div className="flex flex-col items-center gap-6 p-12 w-full h-full justify-center relative">
                        {/* Smooth Radial Gradient Background */}
                        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100 via-white to-slate-200 dark:from-zinc-900 dark:via-black dark:to-zinc-950 opacity-100" />
                        
                        <div className="relative z-10 flex flex-col items-center gap-6">
                          <div className="w-20 h-20 bg-muted/50 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-border/50 shadow-2xl">
                            <Rocket className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Ready to build?</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">Tell AI what you want to create and watch it come to life here.</p>
                          </div>
                          <Button 
                            variant="outline" 
                            className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-muted text-xs font-bold px-6 shadow-sm"
                            onClick={() => setInput(examplePrompt)}
                          >
                            Try an example
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-background relative">
                        {previewLoading && (!project?.files || Object.keys(project.files).length === 0) && (
                          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
                            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span className="text-[10px] font-bold tracking-widest text-foreground/60 uppercase">Loading preview...</span>
                          </div>
                        )}
                        
                        <iframe 
                          src={previewUrl} 
                          className="w-full h-full border-none"
                          title="Preview"
                        />
                        {lastError && lastError.type === 'runtime' && (
                          <div className="absolute inset-x-4 bottom-4 bg-background/90 border border-red-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 z-40 liquid-glass animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="max-w-[200px] sm:max-w-md">
                                <div className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Runtime Error</div>
                                <div className="text-xs font-medium text-foreground line-clamp-1">{lastError.message}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setLastError(null)}
                                className="h-8 text-muted-foreground hover:text-foreground"
                              >
                                Dismiss
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleAutoHeal('runtime', lastError.message, lastError.stack || '')}
                                className="bg-primary text-primary-foreground font-bold h-8 rounded-lg shadow-lg shadow-primary/20"
                              >
                                <Sparkles className="w-3.5 h-3.5 mr-2" />
                                Fix with AI
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

                {/* Decorative Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="flex-1 flex bg-background overflow-hidden">
                {/* File Explorer */}
                <div className="w-64 border-r border-border flex flex-col bg-muted/10">
                  <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/20">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Files</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={handleManualCreateFile}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="px-3 py-2 border-b border-border/50">
                    <div className="relative group">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text"
                        placeholder="Search files..."
                        value={fileSearch}
                        onChange={(e) => setFileSearch(e.target.value)}
                        className="w-full bg-background/50 border border-border rounded-lg py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {buildFileTree(
                      Object.fromEntries(
                        Object.entries(project?.files || {}).filter(([path]) => 
                          path.toLowerCase().includes(fileSearch.toLowerCase())
                        )
                      )
                    ).map(node => (
                      <FileExplorerNode key={node.path} node={node} />
                    ))}
                  </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/30">
                    <div className="flex items-center gap-2">
                      {activeFile && (
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground bg-background px-3 py-1.5 rounded-lg border border-border shadow-sm">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          {activeFile}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                    </div>
                  </div>
                    <div className="flex-1 relative flex flex-col min-h-0">
                      {activeFile && (
                        <MonacoEditor
                          height="100%"
                          language={activeFile.endsWith('.html') ? 'html' : activeFile.endsWith('.css') ? 'css' : activeFile.endsWith('.json') ? 'json' : 'javascript'}
                          theme={theme === 'dark' ? 'vs-dark' : 'light'}
                          value={project?.files?.[activeFile] || ''}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            readOnly: false,
                            automaticLayout: true,
                            padding: { top: 20 },
                          }}
                          onChange={(value) => {
                            if (project && activeFile) {
                              const updatedFiles = { ...project.files, [activeFile]: value || '' }
                              const updatedProject = { ...project, files: updatedFiles, lastModified: Date.now() }
                              setProject(updatedProject)
                              storage.saveProject(updatedProject)
                              // Refresh preview on manual edit
                              handleRefreshPreview()
                            }
                          }}
                        />
                      )}
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-12">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Project Settings</h2>
                    <p className="text-muted-foreground text-sm">Configure integrations and project metadata.</p>
                  </div>

                  {/* Supabase Integration */}
                  <div className="space-y-4 p-6 bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] liquid-glass">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                        <Database className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">Supabase Integration</h3>
                        <p className="text-[11px] text-muted-foreground">Connect your own Supabase project for Auth & Database.</p>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project URL</label>
                        <input 
                          type="text" 
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          placeholder="https://your-project.supabase.co" 
                          className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Anon Key</label>
                        <input 
                          type="password" 
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                          placeholder="your-anon-key" 
                          className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleTestSupabase}
                        disabled={isSupabaseTesting}
                        className={cn(
                          "w-full font-bold h-10 rounded-xl transition-all",
                          supabaseStatus === 'success' ? "bg-green-600 hover:bg-green-700 text-white" :
                          supabaseStatus === 'error' ? "bg-red-600 hover:bg-red-700 text-white" :
                          "bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90"
                        )}
                      >
                        {isSupabaseTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {supabaseStatus === 'success' ? "Connected ✓" : 
                         supabaseStatus === 'error' ? "Connection Failed" : "Test Connection"}
                      </Button>
                    </div>
                  </div>

                  {/* GitHub Sync */}
                  <div className="space-y-4 p-6 bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] liquid-glass">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#24292f]/10 flex items-center justify-center border border-[#24292f]/20">
                        <Github className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">GitHub Source Control</h3>
                        <p className="text-[11px] text-muted-foreground">Manage branches and pull requests.</p>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Repository</label>
                          <input 
                            type="text" 
                            value={githubRepo}
                            onChange={(e) => setGithubRepo(e.target.value)}
                            placeholder="username/project-repo" 
                            className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Token</label>
                          <input 
                            type="password" 
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx" 
                            className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>

                      {githubStatus === 'success' && (
                        <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/50 my-2">
                          <div className="p-3 bg-background/50 border border-border rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GitBranch className="w-3 h-3 text-primary" />
                              <span className="text-[10px] font-bold">main</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold">Switch</Button>
                          </div>
                          <div className="p-3 bg-background/50 border border-border rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GitPullRequest className="w-3 h-3 text-blue-500" />
                              <span className="text-[10px] font-bold">0 PRs</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold">Create</Button>
                          </div>
                        </div>
                      )}

                      <Button 
                        size="sm" 
                        onClick={handlePushToGithub}
                        disabled={isGithubPushing}
                        className={cn(
                          "w-full font-bold h-10 rounded-xl flex items-center justify-center gap-2 transition-all",
                          githubStatus === 'success' ? "bg-green-600 hover:bg-green-700 text-white" :
                          githubStatus === 'error' ? "bg-red-600 hover:bg-red-700 text-white" :
                          "bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90"
                        )}
                      >
                        {isGithubPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                        {githubStatus === 'success' ? "Sync with GitHub ✓" : 
                         githubStatus === 'error' ? "Sync Failed" : "Connect & Push"}
                      </Button>
                    </div>
                  </div>

                  {/* Database Visualizer */}
                  <div className="space-y-4 p-6 bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] liquid-glass">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Database className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">Schema Visualizer</h3>
                          <p className="text-[11px] text-muted-foreground">Manage your Supabase tables and relationships visually.</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs font-bold" onClick={addDbTable}>
                        <Plus className="w-3 h-3 mr-1" /> Add Table
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {dbTables.map(table => (
                        <div key={table.name} className="p-4 bg-background/50 border border-border rounded-xl space-y-3 hover:border-primary/30 transition-colors group relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold">{table.name}</span>
                            <span className="text-[9px] text-muted-foreground">{table.columns.length} columns</span>
                          </div>
                          <div className="space-y-1">
                            {table.columns.map(col => (
                              <div key={col.name} className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground">{col.name}</span>
                                <span className="text-primary/60 font-mono">{col.type}</span>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => setDbTables(dbTables.filter(t => t.name !== table.name))}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Management */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-red-500">Danger Zone</h3>
                    <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-[2rem] flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold">Delete Project</div>
                        <div className="text-[11px] text-muted-foreground">This action cannot be undone. All files and history will be lost.</div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={deleteProject}
                        className="font-bold rounded-xl h-10 px-6"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-2xl font-bold">Knowledge Base</h2>
                      <p className="text-sm text-muted-foreground">Add documentation or rules to guide the AI's behavior for this project.</p>
                    </div>
                    <Button 
                      onClick={handleGenerateDocs}
                      disabled={isGeneratingDocs}
                      className="bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-xl gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {isGeneratingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate Documentation
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {Object.entries(project?.knowledge || {}).length === 0 ? (
                      <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-[2rem] opacity-60">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm">No instructions or rules added yet.</p>
                      </div>
                    ) : (
                      Object.entries(project?.knowledge || {}).map(([title, content]) => (
                        <div key={title} className="p-6 bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] liquid-glass space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Book className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-bold">{title}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteKnowledge(title)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <textarea 
                            className="w-full bg-background/50 border border-border rounded-xl p-4 text-sm outline-none focus:border-primary/50 transition-all font-mono min-h-[150px] resize-none"
                            defaultValue={content}
                            placeholder="Enter instructions, rules, or documentation here..."
                            onBlur={(e) => saveKnowledge(title, e.target.value)}
                          />
                        </div>
                      ))
                    )}

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-12 rounded-xl border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-sm font-bold gap-2"
                      onClick={() => {
                        const title = prompt("Enter instruction title (e.g., 'Coding Standards'):")
                        if (title) saveKnowledge(title, "")
                      }}
                    >
                      <Plus className="w-4 h-4" /> Add Instruction/Rule
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold">Project History</h2>
                    <p className="text-sm text-muted-foreground">Revert to previous versions of your project (Time Travel).</p>
                  </div>

                  <div className="space-y-4">
                    {(!project?.history || project.history.length === 0) ? (
                      <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-[2rem] opacity-60">
                        <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm">No history records yet. Start building to see changes here.</p>
                      </div>
                    ) : (
                      project.history.map((item: any) => (
                        <div key={item.id} className="p-6 bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] liquid-glass flex items-center justify-between group hover:border-primary/50 transition-all">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-bold truncate max-w-md">{item.description}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Monitor className="w-3 h-3" />
                                {new Date(item.timestamp).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FileCode className="w-3 h-3" />
                                {item.filesModified?.length || 0} files modified
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRestoreHistory(item.id)}
                            className="rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Restore version
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deploy' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold">Deployment & Hosting</h2>
                    <p className="text-sm text-muted-foreground">Ship your application to production with one click.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vercel */}
                    <div className="p-8 bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] liquid-glass space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                          <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold">Vercel</h3>
                          <p className="text-xs text-muted-foreground">Instant global deployment.</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-background/50 border border-border rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Status</span>
                            <span className="text-muted-foreground font-bold italic">Not deployed</span>
                          </div>
                        </div>
                        <Button 
                          className="w-full rounded-xl font-bold bg-slate-900 text-white hover:opacity-90"
                          onClick={handlePublish}
                        >
                          Deploy to Vercel
                        </Button>
                      </div>
                    </div>

                    {/* Netlify */}
                    <div className="p-8 bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] liquid-glass space-y-6 opacity-60">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold">Netlify</h3>
                          <p className="text-xs text-muted-foreground">Automated builds and serverless.</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full rounded-xl font-bold border-dashed">
                        Connect Netlify
                      </Button>
                    </div>
                  </div>

                  {/* Environment Variables */}
                  <div className="p-8 bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] liquid-glass space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">Environment Variables</h3>
                      <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold gap-2">
                        <Plus className="w-3 h-3" /> Add Variable
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="text-center py-8 bg-background/50 border border-dashed border-border rounded-xl opacity-60">
                        <p className="text-xs text-muted-foreground">No environment variables added yet.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
    </TooltipProvider>
  )
}

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label,
  xCoord = 50 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  xCoord?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all",
            active 
              ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        style={{ 
          position: 'fixed', 
          left: `${(xCoord / 10000) * 100}vw`, 
          transform: 'translateX(-50%)'
        }}
        sideOffset={12}
        className="bg-popover border border-border text-popover-foreground px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-xl animate-in fade-in zoom-in-95 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-1"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
