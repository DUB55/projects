"use client"

import { useEffect, useState, useRef, use } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronLeft,
  ChevronRight,
  Copy,
  Book,
  Trash2,
  Check,
  MessageSquare,
  Plus,
  ArrowRight,
  AlertCircle,
  Image as ImageIcon,
  FileUp,
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
  Grid,
  Sparkles,
  ZapOff,
  ClipboardList,
  Monitor,
  Cloud,
  Layers,
  History,
  Gauge,
  Database,
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
  Tablet,
  Smartphone,
  Download,
  Terminal as TerminalIcon,
  Folder,
  FileText,
  Play,
  Settings,
  X,
  Maximize2 as Maximize,
  RefreshCw,
  Eye,
  Code,
  Image,
} from "lucide-react"
import JSZip from "jszip"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { DUB5AIService } from "@/lib/dub5ai"
import { Terminal } from "@/components/terminal"
import { useWebContainer } from "@/hooks/use-webcontainer"
import { storage, Project } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

export default function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [project, setProject] = useState<Project | null>(null)
  
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'files' | 'history' | 'settings' | 'assets' | 'icons' | 'knowledge'>('preview')
  const [projectHistory, setProjectHistory] = useState<any[]>([])
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [gradientTheme, setGradientTheme] = useState<'blue' | 'pink'>('blue')
  const [executionMode, setExecutionMode] = useState<'plan' | 'fast'>('fast')
  const [executionType, setExecutionType] = useState<'agent' | 'confirmation'>('agent')
  const [stagedChanges, setStagedChanges] = useState<{ 
    type: 'write' | 'delete' | 'rename', 
    path?: string, 
    content?: string, 
    from?: string, 
    to?: string 
  }[] | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const [streamingText, setStreamingText] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("about:blank")
  const [lastError, setLastError] = useState<{ type: 'runtime' | 'terminal', message: string, stack?: string, command?: string } | null>(null)
  const [autoHealingActive, setAutoHealingActive] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottom = useRef(true)

  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      // If we're within 50px of the bottom, we consider it "at bottom"
      isAtBottom.current = scrollHeight - scrollTop - clientHeight < 50
    }
  }

  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [assetSearch, setAssetSearch] = useState("")
  const [knowledgeSearch, setKnowledgeSearch] = useState("")
  const [knowledgeInput, setKnowledgeInput] = useState("")
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false)
  const [iconSearch, setIconSearch] = useState("")
  const assetInputRef = useRef<HTMLInputElement>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const terminalRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { instance: webcontainer, mountFiles } = useWebContainer()
  const shellProcessRef = useRef<any>(null)
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [highlightProjectName, setHighlightProjectName] = useState(false)

  const updateUIHeader = (newName: string) => {
    if (typeof document !== 'undefined') {
      document.title = `${newName} | Aether Editor`
    }
    setHighlightProjectName(true)
    setTimeout(() => setHighlightProjectName(false), 2000)
  }

  useEffect(() => {
    const loadProject = async () => {
      const p = await storage.getProject(projectId)
      if (p) {
        setProject(p)
        setMessages(p.chatHistory || [])
        
        // Auto-trigger first prompt if it's a new project and hasn't been processed
        if (p.chatHistory && p.chatHistory.length === 1 && p.chatHistory[0].role === 'user' && !initialPromptProcessed) {
          setInitialPromptProcessed(true)
          // We need to wait for the state to be updated or pass the values directly
          const firstPrompt = p.chatHistory[0].content
          setTimeout(() => {
            processInitialPrompt(firstPrompt, p)
          }, 500)
        }

        // Set first file as active if available
        const filePaths = Object.keys(p.files || {})
        if (filePaths.length > 0) {
          setActiveFile(filePaths[0])
        }
        // Load history
        const history = await storage.getHistory(p.id)
        setProjectHistory(history)
        // Load settings
        if (p.settings) {
          setSupabaseUrl(p.settings.supabaseUrl || "")
          setSupabaseKey(p.settings.supabaseAnonKey || "")
          setGithubRepo(p.settings.githubRepo || "")
          setGithubToken(p.settings.githubToken || "")
        }
      } else {
        router.push('/')
      }
    }
    loadProject()
  }, [projectId, router])

  useEffect(() => {
    if (activeTab === 'history' && project) {
      storage.getHistory(project.id).then(setProjectHistory)
    }
  }, [activeTab, project])

  // Update active file when project files change if none selected
  useEffect(() => {
    if (project?.files && !activeFile) {
      const filePaths = Object.keys(project.files)
      if (filePaths.length > 0) {
        setActiveFile(filePaths[0])
      }
    }
  }, [project?.files, activeFile])

  useEffect(() => {
    // We already save messages inside sendMessage to avoid race conditions and redundant saves
  }, [messages, project])

  useEffect(() => {
    if (isAtBottom.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, streamingText])

  useEffect(() => {
    const handleScroll = () => {
      // Check if the scrollable area (main content) is scrolled
      const mainContent = document.querySelector('.editor-main-content')
      if (mainContent) {
        setScrolled(mainContent.scrollTop > 20)
      }
    }
    
    // We need to attach this to the actual scrollable element
    const scrollContainer = document.querySelector('.editor-main-content')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
    }
    
    return () => scrollContainer?.removeEventListener('scroll', handleScroll)
  }, [])

  const saveSettings = async () => {
    if (!project) return
    const updatedProject = {
      ...project,
      settings: {
        ...project.settings,
        supabaseUrl,
        supabaseAnonKey: supabaseKey,
        githubRepo,
        githubToken
      }
    }
    await storage.saveProject(updatedProject)
    setProject(updatedProject)
  }

  const deleteProject = async () => {
    if (!project) return
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      await storage.deleteProject(project.id)
      router.push('/')
    }
  }

  const processInitialPrompt = async (prompt: string, currentProject: Project) => {
    if (busy) return
    
    setBusy(true)
    setStreamingText("")
    isAtBottom.current = true
    const nextMessages = currentProject.chatHistory || []
    
    try {
      let projectName = currentProject.name
      let fullResponse = ""
      let projectNameFound = false
      const onChunk = (chunk: string) => {
        fullResponse += chunk
        setStreamingText(fullResponse)

        // Monitor for <project_name> tag
        if (!projectNameFound) {
          const nameMatch = fullResponse.match(/<project_name>(.*?)<\/project_name>/)
          if (nameMatch) {
            const extractedName = nameMatch[1].trim()
            if (extractedName) {
              projectName = extractedName
              projectNameFound = true
              updateUIHeader(extractedName)
            }
          }
        }
      }

      const context = currentProject.files || {}
      
      if (executionMode === 'plan') {
        await DUB5AIService.planExecution(prompt, context, onChunk, abortControllerRef.current?.signal)
      } else {
        await DUB5AIService.generateCode(prompt, context, onChunk, abortControllerRef.current?.signal)
      }

      const actions: any[] = []
      // ... parsing logic ...
      const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g
      let match
      while ((match = fileRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'write', path: match[1], content: match[2].trim() })
      }
      const writeRegex = /<file_action\s+path="([^"]+)">([\s\S]*?)<\/file_action>/g
      while ((match = writeRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'write', path: match[1], content: match[2].trim() })
      }
      const deleteRegex = /<delete_file\s+path="([^"]+)"\s*\/>/g
      while ((match = deleteRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'delete', path: match[1] })
      }
      const renameRegex = /<rename_file\s+from="([^"]+)"\s+to="([^"]+)"\s*\/>/g
      while ((match = renameRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'rename', from: match[1], to: match[2] })
      }
      const shellRegex = /<shell_command>([\s\S]*?)<\/shell_command>/g
      while ((match = shellRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'shell', command: match[1].trim() })
      }

      const hasChanges = actions.length > 0
      
      // Final fallback for project name if AI didn't provide one
      if (projectName === "Untitled Project" || projectName === prompt.slice(0, 30)) {
        projectName = prompt.split(' ').slice(0, 3).join(' ').replace(/[^\w\s]/gi, '') || "Untitled Project"
      }

      if (hasChanges) {
        if (executionType === 'agent') {
          let newFiles = { ...context }
          for (const action of actions) {
            if (action.type === 'write') newFiles[action.path] = action.content
            if (action.type === 'delete') delete newFiles[action.path]
            if (action.type === 'rename') {
              const content = newFiles[action.from]
              delete newFiles[action.from]
              newFiles[action.to] = content
            }
            if (action.type === 'shell') {
              await executeShellCommand(action.command)
            }

            await storage.addHistoryEvent({
              projectId: currentProject.id,
              type: action.type as any,
              path: action.path,
              content: action.content,
              from: action.from,
              to: action.to,
              command: action.command,
              summary: `AI initialized project with ${action.path || action.command}`
            })
          }

          const assistantMsg = { role: "assistant", content: fullResponse, filesUpdated: true }
          const finalMessages = [...nextMessages, assistantMsg]
          setMessages(finalMessages)
          setStreamingText("")
          
          const updatedProject = { 
            ...currentProject, 
            name: projectName,
            files: newFiles, 
            chatHistory: finalMessages,
            lastModified: Date.now() 
          }
          setProject(updatedProject)
          await storage.saveProject(updatedProject)
          
          // Switch to preview if index.html is present or updated
          if (newFiles['index.html']) {
            setPreviewUrl(`/__preview__/index.html?t=${Date.now()}`)
            setPreviewLoading(false)
            setActiveTab('preview')
          } else if (actions.some(a => a.path && (a.path.endsWith('.html') || a.path.endsWith('.js')))) {
            handleRefreshPreview()
          }
        } else {
          setStagedChanges(actions)
          const assistantMsg = { role: "assistant", content: fullResponse, filesProposed: true }
          const finalMessages = [...nextMessages, assistantMsg]
          setMessages(finalMessages)
          setStreamingText("")
          
          const updatedProject = {
            ...currentProject,
            name: projectName,
            chatHistory: finalMessages,
            lastModified: Date.now()
          }
          setProject(updatedProject)
          await storage.saveProject(updatedProject)
        }
      } else {
        const assistantMsg = { role: "assistant", content: fullResponse }
        const finalMessages = [...nextMessages, assistantMsg]
        setMessages(finalMessages)
        setStreamingText("")

        const updatedProject = {
          ...currentProject,
          name: projectName,
          chatHistory: finalMessages,
          lastModified: Date.now()
        }
        setProject(updatedProject)
        await storage.saveProject(updatedProject)
      }
    } catch (error: any) {
      console.error("Initial AI Error:", error)
      setLastError({ type: 'runtime', message: error.message || "An unexpected error occurred during project initialization." })
    } finally {
      setBusy(false)
    }
  }

  const sendMessage = async (overrideInput?: string | React.FormEvent) => {
    let finalInput = ""
    if (typeof overrideInput === 'string') {
      finalInput = overrideInput
    } else {
      overrideInput?.preventDefault()
      finalInput = input.trim()
    }
    
    if (!finalInput || busy) return
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setBusy(true)
    setStreamingText("")
    isAtBottom.current = true
    const userMsg = { role: "user", content: finalInput }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    if (typeof overrideInput !== 'string') setInput("")

    try {
      let fullResponse = ""
      const onChunk = (chunk: string) => {
        fullResponse += chunk
        setStreamingText(fullResponse)

        // Monitor for <project_name> tag (only if not already named properly)
        if (project && (project.name === "Untitled Project" || project.name === project.chatHistory[0]?.content?.slice(0, 30))) {
          const nameMatch = fullResponse.match(/<project_name>(.*?)<\/project_name>/)
          if (nameMatch) {
            const extractedName = nameMatch[1].trim()
            if (extractedName) {
              setProject(prev => prev ? { ...prev, name: extractedName } : null)
              updateUIHeader(extractedName)
            }
          }
        }
      }

      // Prepare context for the AI
      const context = project?.files || {}
      const terminalContext = terminalOutput.join('\n')
      
      const fullInput = terminalContext 
        ? `${finalInput}\n\n[TERMINAL OUTPUT]:\n${terminalContext}`
        : finalInput

      // Prepare knowledge context
      let knowledgeContext = ""
      if (project?.knowledge && Object.keys(project.knowledge).length > 0) {
        knowledgeContext = Object.entries(project.knowledge)
          .map(([title, content]) => `#### ${title}\n${content}`)
          .join('\n\n')
      }

      if (executionMode === 'plan') {
        await DUB5AIService.planExecution(fullInput, context, onChunk, abortControllerRef.current.signal, knowledgeContext)
      } else {
        await DUB5AIService.generateCode(fullInput, context, onChunk, abortControllerRef.current.signal, knowledgeContext)
      }

      // Process file actions from the response
      const actions: any[] = []
      
      // 1. New File Protocol: <file path="...">...</file>
      const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g
      let match
      while ((match = fileRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'write', path: match[1], content: match[2].trim() })
      }

      // 2. Legacy Write File Actions
      const writeRegex = /<file_action\s+path="([^"]+)">([\s\S]*?)<\/file_action>/g
      while ((match = writeRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'write', path: match[1], content: match[2].trim() })
      }

      // 3. Delete File Actions
      const deleteRegex = /<delete_file\s+path="([^"]+)"\s*\/>/g
      while ((match = deleteRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'delete', path: match[1] })
      }

      // 3. Rename File Actions
      const renameRegex = /<rename_file\s+from="([^"]+)"\s+to="([^"]+)"\s*\/>/g
      while ((match = renameRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'rename', from: match[1], to: match[2] })
      }

      // 4. Shell Command Actions
      const shellRegex = /<shell_command>([\s\S]*?)<\/shell_command>/g
      while ((match = shellRegex.exec(fullResponse)) !== null) {
        actions.push({ type: 'shell', command: match[1].trim() })
      }

      const hasChanges = actions.length > 0

      if (hasChanges) {
        if (executionType === 'agent') {
          // Automatically apply changes
          let newFiles = { ...context }
          for (const action of actions) {
            if (action.type === 'write') newFiles[action.path] = action.content
            if (action.type === 'delete') delete newFiles[action.path]
            if (action.type === 'rename') {
              const content = newFiles[action.from]
              delete newFiles[action.from]
              newFiles[action.to] = content
            }
            if (action.type === 'shell') {
              await executeShellCommand(action.command)
            }

            // Record in history
            await storage.addHistoryEvent({
              projectId: projectId as string,
              type: action.type as any,
              path: action.path,
              content: action.content,
              from: action.from,
              to: action.to,
              command: action.command,
              summary: `AI modified ${action.path || action.command}`
            })
          }

          const assistantMsg = { role: "assistant", content: fullResponse, filesUpdated: true }
          const finalMessages = [...nextMessages, assistantMsg]
          setMessages(finalMessages)
          setStreamingText("")
          
          if (project) {
            const updatedProject = { 
              ...project, 
              files: newFiles, 
              chatHistory: finalMessages,
              lastModified: Date.now() 
            }
            setProject(updatedProject)
            await storage.saveProject(updatedProject)
            
            if (!activeFile || newFiles[activeFile]) {
              setActiveFile(activeFile && newFiles[activeFile] ? activeFile : Object.keys(newFiles)[0])
            }

            // Switch to preview if index.html is present or updated
            if (newFiles['index.html']) {
              setPreviewUrl(`/__preview__/index.html?t=${Date.now()}`)
              setPreviewLoading(false)
              setActiveTab('preview')
            } else if (actions.some(a => a.path && (a.path.endsWith('.html') || a.path.endsWith('.js')))) {
              handleRefreshPreview()
            }
          }
        } else {
          // Confirmation mode: Stage changes
          setStagedChanges(actions)
          const assistantMsg = { role: "assistant", content: fullResponse, filesProposed: true }
          const finalMessages = [...nextMessages, assistantMsg]
          setMessages(finalMessages)
          setStreamingText("")
          
          if (project) {
            const updatedProject = {
              ...project,
              chatHistory: finalMessages,
              lastModified: Date.now()
            }
            setProject(updatedProject)
            await storage.saveProject(updatedProject)
          }
        }
      } else if (project) {
        // Even if no files changed, save the chat history
        const assistantMsg = { role: "assistant", content: fullResponse }
        const finalMessages = [...nextMessages, assistantMsg]
        setMessages(finalMessages)
        setStreamingText("")

        const updatedProject = {
          ...project,
          chatHistory: finalMessages,
          lastModified: Date.now()
        }
        setProject(updatedProject)
        await storage.saveProject(updatedProject)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted')
        return
      }
      console.error("AI Error:", error)
      const errorMessage = error instanceof Error ? error.message : "Request failed. Try again."
      const errorAssistantMsg = {
        role: "assistant",
        content: `Error: ${errorMessage}`
      }
      setMessages(prev => [...prev, errorAssistantMsg])
    } finally {
      setBusy(false)
      abortControllerRef.current = null
    }
  }

  const executeShellCommand = async (command: string) => {
    if (!webcontainer || !command) return
    
    setShowTerminal(true)
    setLastError(null)
    
    try {
      // Use a one-off process to track exit code for important commands
      const process = await webcontainer.spawn('jsh', ['-c', command])
      
      let output = ""
      process.output.pipeTo(new WritableStream({
        write(data) {
          output += data
          if (terminalRef.current) terminalRef.current.write(data)
          setTerminalOutput(prev => {
            const next = [...prev, data]
            return next.slice(-50)
          })
        }
      }))

      const exitCode = await process.exit
      
      if (exitCode !== 0) {
        console.error(`Command failed with exit code ${exitCode}`)
        setLastError({
          type: 'terminal',
          message: `Command "${command}" failed with exit code ${exitCode}.\nOutput: ${output.slice(-200)}`,
          command
        })
        
        // Auto-healing: If in agent mode, we could trigger a fix automatically
        if (executionType === 'agent') {
          handleAutoHeal('terminal', command, output)
        }
      }
      
      return { exitCode, output }
    } catch (error: any) {
      console.error("Shell execution error:", error)
      setLastError({
        type: 'terminal',
        message: error.message || "Failed to execute command",
        command
      })
    }
  }

  const handleAutoHeal = async (type: 'runtime' | 'terminal', context: string, details: string) => {
     if (autoHealingActive || busy) return
     
     setAutoHealingActive(true)
     setLastError(null)
     const prompt = type === 'terminal' 
       ? `The command "${context}" failed. Here is the output:\n${details}\n\nPlease analyze the error and suggest a fix.`
       : `A runtime error occurred in the preview:\n${context}\nDetails: ${details}\n\nPlease analyze the error and suggest a fix.`;
     
     await sendMessage(prompt)
     setAutoHealingActive(false)
   }

   const applyStagedChanges = async () => {
    if (!stagedChanges || !project) return
    
    let newFiles = { ...project.files }
    for (const action of stagedChanges) {
      if (action.type === 'write') newFiles[action.path!] = action.content!
      if (action.type === 'delete') delete newFiles[action.path!]
      if (action.type === 'rename') {
        const content = newFiles[action.from!]
        delete newFiles[action.from!]
        newFiles[action.to!] = content
      }
      if (action.type === 'shell') {
        await executeShellCommand(action.command!)
      }
      
      // Record in history
      await storage.addHistoryEvent({
        projectId: project.id,
        type: action.type as any,
        path: action.path,
        content: action.content,
        from: action.from,
        to: action.to,
        command: action.command,
        summary: `AI modified ${action.path || action.command}`
      })
    }

    const updatedProject = {
      ...project,
      files: newFiles,
      lastModified: Date.now()
    }
    
    setProject(updatedProject)
    await storage.saveProject(updatedProject)
    setStagedChanges(null)
    
    if (newFiles['index.html']) {
      setPreviewUrl(`/__preview__/index.html?t=${Date.now()}`)
      setPreviewLoading(false)
      setActiveTab('preview')
    }
  }

   const discardStagedChanges = () => {
    setStagedChanges(null)
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PREVIEW_ERROR') {
        console.error('Preview Error detected:', event.data)
        const errorMsg = event.data.message || 'Unknown runtime error'
        setLastError({
          type: 'runtime',
          message: errorMsg,
          stack: event.data.stack
        })
        
        // Auto-healing for runtime errors
        if (executionType === 'agent') {
          handleAutoHeal('runtime', errorMsg, event.data.stack || '')
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [executionType])

  useEffect(() => {
    // Register Service Worker for Preview
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/preview-sw.js')
        .then(reg => {
          console.log('SW Registered', reg)
          // If the SW is already active, sync VFS immediately
          if (reg.active && project) {
            reg.active.postMessage({
              type: 'SET_VFS',
              files: project.files
            })
          }
        })
        .catch(err => console.error('SW Registration Failed', err))

      // Listen for controller changes (e.g. after first registration)
      const handleControllerChange = () => {
        if (navigator.serviceWorker.controller && project) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SET_VFS',
            files: project.files
          })
        }
      }
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  useEffect(() => {
    // Update VFS in Service Worker and WebContainer whenever project files change
    if (project) {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_VFS',
          files: project.files
        })
      }
      
      if (webcontainer) {
        mountFiles(project.files)
      }
    }
  }, [project, webcontainer, mountFiles])

  useEffect(() => {
    if (!webcontainer) return

    const handleServerReady = (port: number, url: string) => {
      setPreviewUrl(url)
      setPreviewLoading(false)
      setActiveTab('preview')
    }

    webcontainer.on('server-ready', handleServerReady)

    return () => {
      // Clean up listeners if needed (WebContainer API doesn't have off() usually, but handles it internally)
    }
  }, [webcontainer])

  const startShell = async (terminal: any) => {
    if (!webcontainer) return

    const shellProcess = await webcontainer.spawn('jsh', {
      terminal: {
        cols: terminal.cols,
        rows: terminal.rows,
      },
    })

    shellProcessRef.current = shellProcess

    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
          setTerminalOutput(prev => {
            const next = [...prev, data]
            if (next.length > 50) return next.slice(-50)
            return next
          })
        },
      })
    )

    const input = shellProcess.input.getWriter()
    terminal.onData((data: string) => {
      input.write(data)
    })
  }

  const handleDownload = async () => {
    if (!project) return
    
    const zip = new JSZip()
    Object.entries(project.files).forEach(([path, content]) => {
      zip.file(path, content)
    })
    
    const blob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportCode = async () => {
    // Export code is basically download for now, or we can add a specialized toast
    toast.success("Preparing project export...")
    await handleDownload()
  }

  const handleConnectDomain = () => {
    setActiveTab('settings')
    toast.info("Opening domain settings...")
    // Scroll to a hypothetical domain section in settings if it existed
  }

  const handleRefreshPreview = () => {
    setPreviewLoading(true)
    // Force reload the iframe by appending a timestamp
    setPreviewUrl(`/__preview__/index.html?t=${Date.now()}`)
    setTimeout(() => setPreviewLoading(false), 500)
  }

  const addKnowledge = async (name: string, content: string) => {
    if (!project || !name || !content) return
    const newKnowledge = { ...(project.knowledge || {}), [name]: content }
    const updated = { ...project, knowledge: newKnowledge, lastModified: Date.now() }
    setProject(updated)
    await storage.saveProject(updated)
    setKnowledgeInput("")
    setIsAddingKnowledge(false)
  }

  const deleteKnowledge = async (name: string) => {
    if (!project || !project.knowledge) return
    const newKnowledge = { ...project.knowledge }
    delete newKnowledge[name]
    const updated = { ...project, knowledge: newKnowledge, lastModified: Date.now() }
    setProject(updated)
    await storage.saveProject(updated)
  }

  const deleteAsset = async (name: string) => {
    if (!project || !project.assets) return
    const newAssets = { ...project.assets }
    delete newAssets[name]
    const updated = { ...project, assets: newAssets, lastModified: Date.now() }
    setProject(updated)
    await storage.saveProject(updated)
  }

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !project) return
    const files = Array.from(e.target.files)
    const newAssets = { ...(project.assets || {}) }

    for (const file of files) {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      newAssets[file.name] = dataUrl
    }

    const updated = { ...project, assets: newAssets, lastModified: Date.now() }
    setProject(updated)
    await storage.saveProject(updated)
  }

  const files = Object.keys(project?.files || {})

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden text-foreground selection:bg-primary/30">
      {/* Top Navigation Bar */}
      <header className={cn(
        "h-14 flex items-center justify-between px-4 z-50 transition-all duration-500",
        scrolled 
          ? "bg-background/60 backdrop-blur-xl border-b border-border liquid-glass" 
          : "bg-transparent border-b border-transparent"
      )}>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-lg transition-all duration-300",
              isSidebarCollapsed ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Show Chat" : "Hide Chat"}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Aether</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className={cn(
                  "text-sm font-medium text-muted-foreground truncate max-w-[120px] transition-all duration-500",
                  highlightProjectName && "text-blue-500 scale-110 font-bold"
                )}>
                  {project?.name || 'Untitled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Navigation Icons */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border">
          {[
            { icon: Monitor, label: "Preview", id: 'preview' },
            { icon: Code2, label: "Code", id: 'code' },
            { icon: Folder, label: "Files", id: 'files' },
            { icon: ImageIcon, label: "Assets", id: 'assets' },
            { icon: Grid, label: "Icons", id: 'icons' },
            { icon: Book, label: "Knowledge", id: 'knowledge' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 group relative",
                activeTab === item.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              title={item.label}
            >
              <item.icon className="w-4 h-4" />
              {activeTab === item.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('history')}
            className={cn(
              "h-8 w-8 p-0 rounded-lg transition-all",
              activeTab === 'history' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title="History"
          >
            <History className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('settings')}
            className={cn(
              "h-8 w-8 p-0 rounded-lg transition-all",
              activeTab === 'settings' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          <div className="h-4 w-px bg-border/50 mx-1" />

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg",
              showTerminal && "bg-accent text-foreground"
            )}
            onClick={() => setShowTerminal(!showTerminal)}
            title="Toggle Terminal"
          >
            <TerminalIcon className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
            onClick={handleDownload}
            title="Download Project ZIP"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
            onClick={handleConnectDomain}
            title="Connect Domain"
          >
            <Globe className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
            onClick={handleExportCode}
            title="Export Code"
          >
            <Code2 className="w-4 h-4" />
          </Button>

          <div className="h-4 w-px bg-border/50 mx-1" />

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg flex items-center gap-2"
            onClick={() => toast.info("Sharing coming soon!")}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Share</span>
          </Button>
          <Button 
            size="sm" 
            className="h-8 bg-primary text-primary-foreground font-bold text-xs px-4 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2"
            onClick={() => toast.info("Publishing coming soon!")}
          >
            <Rocket className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </header>

      {/* Main Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Chat Sidebar */}
        <div className={cn(
          "border-r border-border flex flex-col bg-background/50 backdrop-blur-xl transition-all duration-300 relative liquid-glass",
          isSidebarCollapsed ? "w-0 overflow-hidden border-none" : "w-[400px]"
        )}>
          <div 
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide break-words relative pb-44"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-6 opacity-40">
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold">Start building</h3>
                  <p className="text-[12px]">Describe what you want to create and Aether will build it for you.</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className="space-y-4">
                <div className={cn(
                  "flex flex-col gap-2",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  {msg.role === 'user' ? (
                    <div className="bg-muted border border-border rounded-2xl px-4 py-2.5 text-[13px] text-foreground max-w-[90%] shadow-sm liquid-glass">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                          pre: ({ children }) => <pre className="overflow-x-auto max-w-full p-2 bg-muted/50 rounded-lg my-2 scrollbar-hide break-all whitespace-pre-wrap text-foreground">{children}</pre>,
                          code: ({ children }) => <code className="bg-muted/80 px-1 rounded text-foreground break-all">{children}</code>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 text-[13px] leading-relaxed text-muted-foreground font-normal markdown-content">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                               p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                               pre: ({ children }) => <pre className="overflow-x-auto max-w-full p-2 bg-muted/50 rounded-lg my-2 scrollbar-hide break-all whitespace-pre-wrap text-foreground">{children}</pre>,
                               code: ({ children }) => <code className="bg-muted/80 px-1 rounded text-foreground break-all">{children}</code>
                             }}
                          >
                            {msg.content.replace(/<(file|file_action|delete_file|rename_file|shell_command)[\s\S]*?<\/(file|file_action|delete_file|rename_file|shell_command)>|<(delete_file|rename_file)[\s\S]*?\/>/g, '')}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {/* File actions indicator */}
                      {msg.filesUpdated && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Files Updated</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Changes applied successfully</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {streamingText && (
              <div className="w-full space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1 text-[13px] leading-relaxed text-muted-foreground animate-pulse whitespace-pre-wrap">
                    {streamingText}
                  </div>
                </div>
              </div>
            )}

            {/* AI Generation Indicator */}
            {busy && !streamingText && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-2 py-1"
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1 ml-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}

            {busy && streamingText && (
              <div className="flex items-center gap-2 px-12 opacity-60">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Generating response</span>
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Container */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <AnimatePresence>
              {stagedChanges && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Proposed Changes</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{stagedChanges.length} actions</span>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-hide">
                    {stagedChanges.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] text-muted-foreground bg-background/40 p-1.5 rounded-lg border border-border/50">
                        {action.type === 'write' && <FileText className="w-3 h-3 text-blue-400" />}
                        {action.type === 'delete' && <ZapOff className="w-3 h-3 text-red-400" />}
                        {action.type === 'rename' && <Folder className="w-3 h-3 text-purple-400" />}
                        {action.type === 'shell' && <TerminalIcon className="w-3 h-3 text-green-400" />}
                        <span className="truncate flex-1">
                          {action.type === 'rename' ? `${action.from} → ${action.to}` : (action.path || action.command)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-primary text-primary-foreground h-8 text-[11px] font-bold shadow-lg shadow-primary/20"
                      onClick={applyStagedChanges}
                    >
                      Apply Changes
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-border h-8 text-[11px] font-bold bg-background/50 backdrop-blur-sm"
                      onClick={discardStagedChanges}
                    >
                      Discard
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-muted/30 rounded-[2rem] p-2 shadow-2xl relative transition-all duration-500 liquid-glass">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Aether to build or change something..."
                className="w-full h-24 bg-transparent border-none focus:ring-0 focus-visible:ring-0 outline-none text-[14px] resize-none placeholder:text-muted-foreground/50 py-2 px-4 text-foreground leading-relaxed scrollbar-hide"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-1">
                  <Popover open={showPlusMenu} onOpenChange={setShowPlusMenu}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-xl transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-card/90 backdrop-blur-2xl border-border p-2 rounded-2xl shadow-2xl liquid-glass" side="top" align="start">
                      <div className="space-y-1">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-start gap-3 px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-colors"
                        >
                          <Upload className="w-4 h-4" /> <span>Upload assets</span>
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          multiple 
                          onChange={handleAssetUpload} 
                        />
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="w-full flex items-center justify-start gap-3 px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-colors"
                        >
                          <Image className="w-4 h-4" /> <span>Add images</span>
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="w-full flex items-center justify-start gap-3 px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-colors"
                        >
                          <FileText className="w-4 h-4" /> <span>Add documents</span>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="h-4 w-px bg-border/50 mx-1" />

                  {/* Consolidated Settings Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 px-3 py-1.5 h-8 rounded-xl bg-background/40 border border-border/50 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-background/60 transition-all uppercase tracking-wider"
                      >
                        <Settings2 className="w-4 h-4" />
                        {executionMode} • {executionType === 'confirmation' ? 'Confirm' : 'Agent'}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-card/90 backdrop-blur-2xl border-border p-2 rounded-2xl shadow-2xl liquid-glass" side="top" align="start">
                      <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Execution Mode</div>
                      <DropdownMenuItem 
                        onClick={() => setExecutionMode('fast')}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-xl transition-colors",
                          executionMode === 'fast' && "bg-primary/10 text-primary font-bold"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" /> <span>Fast</span>
                        </div>
                        {executionMode === 'fast' && <Check className="w-3.5 h-3.5" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setExecutionMode('plan')}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-xl transition-colors",
                          executionMode === 'plan' && "bg-primary/10 text-primary font-bold"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" /> <span>Plan</span>
                        </div>
                        {executionMode === 'plan' && <Check className="w-3.5 h-3.5" />}
                      </DropdownMenuItem>
                      
                      <div className="h-px bg-border/50 my-1 mx-2" />
                      
                      <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Execution Type</div>
                      <DropdownMenuItem 
                        onClick={() => setExecutionType('agent')}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-xl transition-colors",
                          executionType === 'agent' && "bg-primary/10 text-primary font-bold"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> <span>Agent (Auto)</span>
                        </div>
                        {executionType === 'agent' && <Check className="w-3.5 h-3.5" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setExecutionType('confirmation')}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-xl transition-colors",
                          executionType === 'confirmation' && "bg-primary/10 text-primary font-bold"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" /> <span>Confirm Changes</span>
                        </div>
                        {executionType === 'confirmation' && <Check className="w-3.5 h-3.5" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="h-4 w-px bg-border/50 mx-1" />
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || busy}
                    className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                  >
                    {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5 stroke-[2.5px]" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-background relative flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'preview' && (
                <div className="flex-1 relative flex flex-col items-center p-0">
                {/* Preview Container */}
                <div className={cn(
                  "z-10 bg-card/40 backdrop-blur-3xl border-x border-b border-border shadow-2xl overflow-hidden flex flex-col relative transition-all duration-500 ease-in-out liquid-glass",
                  previewDevice === 'desktop' ? "w-full h-full" : 
                  previewDevice === 'tablet' ? "w-[768px] h-full max-h-full rounded-b-[2.5rem] border-t" : 
                  "w-[375px] h-full max-h-full rounded-b-[2.5rem] border-t"
                )}>
                  {/* Device Toggle - Moved inside Preview Container at the top */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-background/50 backdrop-blur-xl border border-border p-1 rounded-xl z-30 liquid-glass scale-90 origin-top-right">
                    <button 
                      onClick={() => setPreviewDevice('desktop')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        previewDevice === 'desktop' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPreviewDevice('tablet')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        previewDevice === 'tablet' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Tablet className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPreviewDevice('mobile')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        previewDevice === 'mobile' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <button 
                      onClick={handleRefreshPreview}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-all"
                      title="Refresh Preview"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>



                  <div className="flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {previewUrl === "about:blank" && !previewLoading ? (
                      <div className="flex flex-col items-center gap-6 p-12">
                        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center border border-border">
                          <Rocket className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold">Ready to build?</h3>
                          <p className="text-muted-foreground max-w-xs mx-auto">Tell Aether what you want to create and watch it come to life here.</p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="rounded-xl border-border hover:bg-muted text-xs font-bold px-6"
                          onClick={() => setInput("Build a modern landing page for a SaaS product.")}
                        >
                          Try an example
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-background relative">
                        {previewLoading && (
                          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-xs font-bold tracking-widest text-foreground uppercase">Building your app...</span>
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

                {/* Decorative Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="flex-1 flex flex-col bg-background">
                <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/30">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {files.map(path => (
                      <button
                        key={path}
                        onClick={() => setActiveFile(path)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                          activeFile === path ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {path}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                      <History className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 relative">
                  {activeFile && (
                    <MonacoEditor
                      height="100%"
                      language={activeFile.endsWith('.html') ? 'html' : activeFile.endsWith('.css') ? 'css' : 'javascript'}
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
                        backgroundColor: theme === 'dark' ? '#0A0A0A' : '#ffffff'
                      }}
                      onChange={(value) => {
                        if (project && activeFile) {
                          const updatedFiles = { ...project.files, [activeFile]: value || '' }
                          setProject({ ...project, files: updatedFiles })
                        }
                      }}
                    />
                  )}
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
                        onClick={saveSettings}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 rounded-xl"
                      >
                        Save Credentials
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
                        <h3 className="text-sm font-bold">GitHub Sync</h3>
                        <p className="text-[11px] text-muted-foreground">Push your code directly to a GitHub repository.</p>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Repository (user/repo)</label>
                        <input 
                          type="text" 
                          value={githubRepo}
                          onChange={(e) => setGithubRepo(e.target.value)}
                          placeholder="username/project-repo" 
                          className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Personal Access Token</label>
                        <input 
                          type="password" 
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxx" 
                          className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        onClick={saveSettings}
                        className="w-full bg-[#24292f] hover:bg-black text-white font-bold h-10 rounded-xl flex items-center justify-center gap-2"
                      >
                        <Github className="w-4 h-4" /> Save GitHub Sync
                      </Button>
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

            {activeTab === 'history' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Project History</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => storage.getHistory(project?.id || '').then(setProjectHistory)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {projectHistory.length === 0 ? (
                      <div className="text-center py-20 opacity-40">
                        <History className="w-12 h-12 mx-auto mb-4" />
                        <p>No history events yet.</p>
                      </div>
                    ) : (
                      projectHistory.map((event) => (
                        <div 
                          key={event.id}
                          className="p-4 bg-muted/30 backdrop-blur-xl border border-border rounded-2xl liquid-glass flex items-start gap-4"
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border border-border",
                            event.type === 'write' ? "bg-blue-500/10 border-blue-500/20" :
                            event.type === 'delete' ? "bg-red-500/10 border-red-500/20" :
                            event.type === 'rename' ? "bg-purple-500/10 border-purple-500/20" :
                            "bg-green-500/10 border-green-500/20"
                          )}>
                            {event.type === 'write' && <FileText className="w-5 h-5 text-blue-500" />}
                            {event.type === 'delete' && <ZapOff className="w-5 h-5 text-red-500" />}
                            {event.type === 'rename' && <Folder className="w-5 h-5 text-purple-500" />}
                            {event.type === 'shell' && <TerminalIcon className="w-5 h-5 text-green-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold capitalize">{event.type} {event.path || event.command}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-[12px] text-muted-foreground">{event.summary}</p>
                            {event.command && (
                              <code className="block mt-2 p-2 bg-black/20 rounded-lg text-[11px] font-mono">
                                $ {event.command}
                              </code>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Project Files</h2>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" /> New File
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {files.map(path => (
                      <div 
                        key={path}
                        onClick={() => {
                          setActiveFile(path)
                          setActiveTab('code')
                        }}
                        className="group p-4 bg-muted/30 backdrop-blur-xl border border-border rounded-2xl hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 liquid-glass"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-background/50 rounded-xl flex items-center justify-center border border-border group-hover:border-primary/30 transition-colors">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-bold truncate">{path}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              {path.split('.').pop()} file
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-8">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold">Asset Manager</h2>
                    <p className="text-sm text-muted-foreground">Manage your project images, icons, and media.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder="Search assets..." 
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50 transition-all liquid-glass"
                      />
                    </div>
                    <input 
                      type="file" 
                      ref={assetInputRef} 
                      onChange={handleAssetUpload} 
                      multiple 
                      className="hidden" 
                      accept="image/*,.svg,.ico"
                    />
                    <Button 
                      onClick={() => assetInputRef.current?.click()}
                      className="bg-primary text-primary-foreground font-bold h-10 rounded-xl shadow-lg shadow-primary/20"
                    >
                      <FileUp className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>

                  {/* Asset Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {Object.entries(project?.assets || {})
                      .filter(([name]) => name.toLowerCase().includes(assetSearch.toLowerCase()))
                      .map(([name, dataUrl]) => (
                        <div key={name} className="group relative aspect-square bg-muted/20 rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all liquid-glass">
                          <img src={dataUrl} alt={name} className="w-full h-full object-contain p-4" />
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 text-center">
                            <p className="text-[10px] font-bold truncate w-full mb-2">{name}</p>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteAsset(name)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Empty State */}
                    {(!project?.assets || Object.keys(project.assets).length === 0) && (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center border border-border">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold">No assets found</h3>
                          <p className="text-[12px] max-w-[200px]">Upload images or icons to use them in your project.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-8">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-2xl font-bold">Knowledge Base</h2>
                      <p className="text-sm text-muted-foreground">Add documentation, requirements, or context for the AI.</p>
                    </div>
                    <Button 
                      onClick={() => setIsAddingKnowledge(true)}
                      className="bg-primary text-primary-foreground font-bold h-10 rounded-xl shadow-lg shadow-primary/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Knowledge
                    </Button>
                  </div>

                  {isAddingKnowledge && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-muted/20 border border-border rounded-3xl space-y-4 liquid-glass"
                    >
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Project Requirements" 
                          id="knowledge-title"
                          className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Content (Markdown)</label>
                        <textarea 
                          rows={10}
                          placeholder="Paste your documentation or context here..." 
                          value={knowledgeInput}
                          onChange={(e) => setKnowledgeInput(e.target.value)}
                          className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsAddingKnowledge(false)}
                          className="h-10 rounded-xl px-6 font-bold text-xs"
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const title = (document.getElementById('knowledge-title') as HTMLInputElement).value
                            addKnowledge(title, knowledgeInput)
                          }}
                          className="h-10 rounded-xl px-6 font-bold text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        >
                          Save Knowledge
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search knowledge items..." 
                      value={knowledgeSearch}
                      onChange={(e) => setKnowledgeSearch(e.target.value)}
                      className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 transition-all liquid-glass"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(project?.knowledge || {})
                      .filter(([name]) => name.toLowerCase().includes(knowledgeSearch.toLowerCase()))
                      .map(([name, content]) => (
                        <div key={name} className="group relative bg-muted/20 rounded-3xl border border-border overflow-hidden hover:border-primary/50 transition-all liquid-glass flex flex-col">
                          <div className="p-6 flex-1 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                  <Book className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-bold text-foreground line-clamp-1">{name}</h3>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteKnowledge(name)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-4 leading-relaxed bg-background/30 p-4 rounded-2xl border border-border/50">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="px-6 py-4 border-t border-border/50 bg-background/30 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{content.length} characters</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setIsAddingKnowledge(true)
                                setKnowledgeInput(content)
                                setTimeout(() => {
                                  (document.getElementById('knowledge-title') as HTMLInputElement).value = name
                                }, 100)
                              }}
                              className="h-8 rounded-lg px-3 font-bold text-[10px] uppercase tracking-wider hover:bg-primary/10 hover:text-primary transition-all"
                            >
                              Edit Item
                            </Button>
                          </div>
                        </div>
                      ))}

                    {/* Empty State */}
                    {(!project?.knowledge || Object.keys(project.knowledge).length === 0) && !isAddingKnowledge && (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center border border-border">
                          <Book className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold">No knowledge items</h3>
                          <p className="text-[12px] max-w-[200px]">Add documentation or context to help the AI understand your project better.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'icons' && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-8">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold">Icon Library</h2>
                    <p className="text-sm text-muted-foreground">Browse and copy Lucide icons for your project.</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search icons (e.g. 'home', 'user', 'settings')..." 
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 transition-all liquid-glass"
                    />
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {/* Common Lucide Icons for AI projects */}
                    {[
                      'Sparkles', 'Zap', 'Brain', 'Globe', 'Code2', 'Monitor', 'Database', 'Layout', 
                      'Layers', 'Cpu', 'Activity', 'Shield', 'Lock', 'Key', 'Fingerprint', 'Eye',
                      'Heart', 'Star', 'Flame', 'Rocket', 'Target', 'Trophy', 'Crown', 'Ghost',
                      'Home', 'Search', 'Settings', 'Bell', 'Mail', 'MessageSquare', 'Phone', 'Video',
                      'User', 'Users', 'UserPlus', 'LogOut', 'LogIn', 'Settings2', 'Sliders', 'ToggleLeft',
                      'File', 'Files', 'Folder', 'FolderPlus', 'Image', 'Music', 'Camera',
                      'Calendar', 'Clock', 'Timer', 'Map', 'Navigation', 'Compass', 'Cloud',
                      'Check', 'X', 'Plus', 'Minus', 'Trash2', 'Edit', 'Copy', 'Share2',
                      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
                      'Play', 'Pause', 'Square', 'FastForward', 'Rewind', 'SkipForward', 'SkipBack', 'Shuffle'
                    ].filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()))
                    .map(name => {
                      const IconComponent = (require('lucide-react') as any)[name]
                      if (!IconComponent) return null
                      return (
                        <div 
                          key={name}
                          onClick={() => {
                            navigator.clipboard.writeText(`<${name} className="w-5 h-5" />`)
                            // Show toast or temporary feedback
                          }}
                          className="group flex flex-col items-center justify-center p-4 bg-muted/20 border border-border rounded-2xl hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 liquid-glass"
                        >
                          <IconComponent className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">{name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Panel */}
          {showTerminal && (
            <div className="h-[250px] border-t border-border bg-[#0a0a0a]/80 backdrop-blur-2xl flex flex-col z-40 liquid-glass">
              <div className="h-8 border-b border-border flex items-center justify-between px-3 bg-background/30">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terminal</span>
                </div>
                <button 
                  onClick={() => setShowTerminal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <Terminal onReady={startShell} />
                {lastError && lastError.type === 'terminal' && (
                  <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <div className="bg-background/90 border border-red-500/50 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-md text-center liquid-glass animate-in zoom-in-95">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-foreground">Command Failed</div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{lastError.message}</p>
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setLastError(null)}
                          className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground font-bold text-xs"
                        >
                          Dismiss
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleAutoHeal('terminal', lastError.command || '', lastError.message)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-10 rounded-xl shadow-lg shadow-red-500/20 text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-2" />
                          Fix with AI
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
