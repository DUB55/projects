# FREE LOVABLE ALTERNATIVE — FULL ARCHITECTURE & BLUEPRINT
MISSION STATEMENT
Build a 100% free, high-quality, reliable, fast, multi-agent AI-powered platform that functions as an open, free alternative to Lovable, starting with:

AI Chat View (chat interface powered by multi-model routing)
Explorer View (file tree + content preview, but NO code editing or app generation YET)
Multi-model free AI intelligence
Local model fallback + cloud free tiers
Unlimited usage through rotation + fallback logic

This blueprint defines the architecture, phases, technologies, agent modes, AI routing logic, UI layout, and system behaviors, allowing an AI agent builder to construct the system step-by-step.
This version focuses ONLY on free AI functionality, chat mode, and explorer mode.

# PHASE 0 — GLOBAL REQUIREMENTS
Core Principles

The entire platform must be 100% free for the user, forever.
AI functionality must be unlimited, using:

Local models
Free cloud models
Automatic fallback when rate limits are reached


The system must support:

Agent Mode → automated multi-agent reasoning
Chat Mode → normal conversational mode


The UI must contain:

Chat View
Explorer View


Code generation and app building will come AFTER the above.


# PHASE 1 — TECHNOLOGY STACK
1.1 — Frontend

Next.js (App Router, latest version)
React 18+
TailwindCSS (free, fast)
Monaco Editor (in Explorer View for file preview only)
ShadCN/UI (free UI components)


1.2 — Backend
Support both Node.js and Python depending on the AI engine:
Node.js Backend (Primary)

Runs core business logic
Provides REST + WebSocket endpoints
Handles model routing
Manages local inference server
Manages explorer view file system

Python Backend (Optional / AI Engine)

Handles local model inference if using Python-based libraries
Runs multi-agent orchestrators
Can be deployed free on:

Vercel Functions (Python runtime)
AWS Lambda free tier
Cloudflare Workers with Python WASM




1.3 — Hosting
Frontend + Node backend

Vercel free tier (primary, automatic routing, fast CDN)

Optional additional free hosting

GitHub Pages (fallback only)
Render.com free tier for long-running instances
Railway free tier

All must remain optional. The AI builder should choose the best for the final user.

# PHASE 2 — AI FUNCTIONALITY (FREE, UNLIMITED, FAST)
2.1 — Local AI Models (All Included)
The system must support ALL of the following local models via Ollama or LM Studio or GPT4All, chosen automatically based on performance mode.
Heavy models (maximum intelligence)

DeepSeek-R1
DeepSeek-Coder-V2
Qwen2.5 Coder 14B/32B
StarCoder2 15B
Mistral Nemo 12B
Codestral

Medium models (balanced)

Qwen2.5 Coder 7B
DeepSeek-Coder 6.7B
Mistral 7B
StarCoder2 7B

Small models (for slow/bad laptops)

Phi-3-mini
Gemma 2B/7B
StarCoder2 3B
Qwen 1.8B
TinyLlama 1.1B

Behavior
The AI agent builder must implement:

Automatic model selection based on hardware performance
Option for manual model override in settings
Automatic rotation between local models if overload is detected


2.2 — Free Cloud AI Models (All Included)
The system must automatically rotate between every free endpoint, ensuring unlimited usage:
Primary Free Cloud Models

DeepSeek Cloud free tier
HuggingFace Inference API (free)
Mistral AI free tier
Gemini Nano via Chrome client side execution (free)
Together AI free credits (if available)
OpenRouter free-tier models
OpenAI-compatible free endpoints (public free models)

Cloud Model Routing Rules

If local model = unavailable → use cloud
If cloud API = rate-limited → automatically switch to next provider
If all clouds = exhausted → fallback to smallest local model
If user enables “slow but infinite mode” → use tiny local models only
System should NEVER fail → always have a fallback


# PHASE 3 — MODES OF OPERATION
3.1 — Chat Mode
Pure conversational mode, NO app building.
Features:

Unlimited messages
Model selection dropdown
Temperature + speed settings
Memory toggle
Ability to attach files
Explorer View visible but read-only


3.2 — Agent Mode
In this mode, the system uses multi-agent orchestration to analyze requests and perform tasks.
Agents include:


Planner Agent

Understands user goal
Breaks down tasks
Plans multi-step workflow



Reasoning Agent

Uses models like DeepSeek-R1
Handles deep problem solving



Knowledge Agent

Searches local files in explorer
Retrieves context



Routing Agent

Chooses which model to use
Manages fallback logic



Interaction Agent

Communicates with user
Shows intermediate results



NO code generation yet
Agent mode functions ONLY as:

AI problem solving
Intelligent tasks
Thought chains
Multi-step workflows
File reading from Explorer View


# PHASE 4 — EXPLORER VIEW ARCHITECTURE
Purpose
Explorer View is the interface that displays:

Folder tree
File contents
Metadata
Previews (JSON, Markdown, text, images)

No editing. No creation. No deletions.
Technology

Node.js backend for file system
Next.js + Monaco Editor for viewing
Support local virtual project storage
Support cloud synced storage (optional)

Features

Breadcrumb navigation
File content preview
AI queries reading from files
File search
Display model-generated temporary files

AI Integration
Agents must be able to:

Read files
Reference files in conversation
Use file content as context


# PHASE 5 — MODEL ROUTING LOGIC
Routing Priority

User-selected model
If none selected → automatic best model based on hardware & speed mode
If model unavailable:

Check local availability
Else check cloud free models
Else check fallback local small models
Else degrade to offline minimal mode



Performance Modes
1. Maximum Speed Mode

Use smallest models
Fast responses
Less intelligence

2. Balanced Mode

Use medium models
Balanced speed & intelligence

3. Maximum Intelligence Mode

Use biggest local models
Or highest-quality free cloud models
Slower, but best reasoning

4. Unlimited Free Mode

Rotate through all free cloud endpoints
Use fallback local tiny models
Never hits rate limits


# PHASE 6 — AGENT ARCHITECTURE
6.1 — Required Agents
The agent builder must include:

Routing Agent
Planner Agent
Reasoning Agent
Retriever Agent (Explorer View)
Interaction Agent
State Manager Agent

6.2 — Required Behaviors

Agents must communicate with each other
Planner agent exchanges information with reasoning agent
Retriever agent supplies file content
Interaction agent explains results to user
Routing agent chooses the best model

6.3 — Supported Frameworks
The agent builder may choose:

LangGraph
LangChain
Custom Node.js orchestrator
Custom Python orchestrator

All must be free.

# PHASE 7 — DEPLOYMENT STRATEGY
7.1 — Frontend + Node Backend

Deploy on Vercel (completely free)
SSR + API Routes
Edge functions for speed

7.2 — Python Backend (optional)

Deploy via:

Vercel Python functions
Render free tier
Railway free tier



All optional.
7.3 — Local AI Inference
User can enable:

Ollama local server
LM Studio local server
GPT4All local engine

System must autodetect.

# PHASE 8 — FIRST RELEASE REQUIREMENTS
This blueprint focuses on delivering the first minimal version of your platform.
MUST-HAVE FEATURES

Chat Mode
Agent Mode (without code generation)
Explorer View (read-only)
Local model inference
Cloud model fallback
Routing + fallback logic
Performance modes
Unlimited free usage
Model selector

MUST NOT include (yet)

App building
Code generation
Project creation
Deployment of generated apps

Those come later, after AI + UI are done.

# PHASE 9 — WHAT THE AI AGENT BUILDER MUST UNDERSTAND
The AI agent builder must interpret this blueprint as instructions for:

Architecture design
Component creation
Multi-agent logic
Model routing system
UI structure
Backend integration
Deployment strategy
Future extensibility

It MUST understand that:

Future prompts will require actual building
Code editors, generation, scaffolding come afterward
Supabase integration comes later
Authentication system comes later
Full Lovable-like functionality comes later

This blueprint sets the foundation.

# PHASE 10 — FINAL NOTES FOR THE AGENT BUILDER
The AI agent builder must:

Build everything with maximum free usage as the top priority
Keep expansion in mind for later phases
Allow both Node.js and Python backends
Use Next.js as the frontend
Include all local + cloud AI models
Implement agent + chat modes
Build a robust file explorer
Never create or modify code in this phase
Ensure the platform is stable, fast, and intuitive