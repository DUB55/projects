# Project ALOV: Phased Implementation Plan
## Prompt‑to‑App Full‑Stack AI Builder ($0 Cost Architecture)

This document is the master blueprint for building **ALOV**. It is designed to be executed by an AI agent builder. The architecture ensures **$0 operating cost** by leveraging the **DUB5 AI** backend and client-side execution.

---

## Phase 1: DUB5 AI Integration & Foundation
**Goal:** Establish the core AI communication layer using the universal DUB5 guide.

- **1.1 DUB5 AI Client Implementation**
  - Implement the `Dub5AIService` to POST to `https://chatbot-beta-weld.vercel.app/api/chatbot`.
  - Handle SSE (`text/event-stream`) streaming with incremental JSON parsing.
  - Implement progressive UI updates (typing effect) and an `AbortController` for cancelling requests.
  - Support the "Universal Guide" contract: `{ "input": "...", "task": "...", "params": {...} }`.
  - **AI Execution Modes:**
    - **Agent Mode (Default):** AI automatically applies file changes and shell commands upon generation.
    - **Confirmation Mode:** AI stages changes in a "Proposed" layer; user must manually "Apply" or "Reject" before files are modified.

- **1.2 Static Platform Scaffold**
  - Build a high-performance SPA (Next.js/React) hosted on a free static provider.
  - Implement **IndexedDB** for local-first project storage.
  - Create the base IDE layout: Chat sidebar, File explorer, Code editor (Monaco), and Preview pane.

---

## Phase 2: Agentic Actions & Basic Web (HTML/CSS/JS)
**Goal:** Transform the AI from a chatter into a builder for standard web files.

- **2.1 Action Protocol Implementation**
  - Define and implement the "Action System" that the AI can trigger:
    - `WRITE_FILE(path, content)`: Creates or updates files in the VFS.
    - `DELETE_FILE(path)`: Removes files.
    - `RENAME_FILE(oldPath, newPath)`: Organizes the structure.
  - **Verification:** Ensure the AI can successfully create a multi-file HTML/CSS/JS project (e.g., an `index.html`, `style.css`, and `script.js`) and have them link correctly.

- **2.2 HTML/CSS/JS Preview Engine**
  - Build a browser-native previewer that mounts the VFS files into an `<iframe>`.
  - Support live-reloading: as the AI writes code, the preview updates instantly.

---

## Phase 3: Export & Portability
**Goal:** Ensure users can take their code anywhere.

- **3.1 Download ZIP Functionality**
  - Implement a "Download Project" button.
  - Use `JSZip` to bundle the entire VFS (IndexedDB state) into a `.zip` file.
  - **Requirement:** Maintain the exact directory structure, filenames, and file content in the export.

---

## Phase 4: Modern Frameworks & Advanced Runtime
**Goal:** Expand capabilities to React, Next.js, and Vite while keeping Basic Web support.

- **4.1 Framework Support Expansion**
  - Integrate a browser-native bundler (e.g., a lightweight Vite-like ESM runner) to support `.jsx`, `.tsx`, and modern imports.
  - **The "WebContainer" Parity Layer ($0 Cost):**
    - Implement an in-browser terminal emulator (Xterm.js).
    - Use `@webcontainer/api` (free for open-source/non-profit) or a client-side Node polyfill to allow `npm install` and `run scripts` within the browser tab.
    - AI must be able to execute shell commands and read terminal output for debugging.
  - Maintain the ability to switch between "Static HTML" mode and "Framework" mode.
  - Allow the AI to manage `package.json` and install dependencies via CDN-based ESM providers (esm.sh).

- **4.2 Advanced Preview Engine**
  - Enhance the preview `<iframe>` to handle complex routing and hot module replacement (HMR) for React/Next.js.

---

## Phase 5: UI Refinement (Liquid Glass Aesthetic)
**Goal:** Apply the premium visual identity to the platform.

- **5.1 Liquid Glass Implementation**
  - Apply `.liquid-glass` utility classes (20px blur, 180% saturation, 0.03 opacity) to:
    - Sidebars and Navigation bars.
    - Project tiles and card elements.
    - The main prompt input bar.
  - Implement smooth hover transitions and dark/light mode consistency (Dark Grey/White).

---

## Phase 6: Advanced Integrations
**Goal:** Add enterprise-grade backend and version control.

- **6.1 Supabase Integration**
  - Connect user-owned Supabase projects for Database, Auth, and Storage.
  - Enable the AI to scaffold DB schemas and Auth flows.

- **6.2 GitHub Sync**
  - Implement two-way synchronization between the browser VFS and a GitHub repository.

---

## Phase 7: Project “Time Machine” (History, Audit, Restore)
**Goal:** Make every AI + user change reversible, inspectable, and attributable.

- **7.1 Event‑Sourced Change Log**
  - Store every mutation (FILE_WRITE, DELETE, etc.) as an immutable event in IndexedDB.
  - Periodic snapshots + delta patches for fast state reconstruction.
- **7.2 Visual Timeline (“Moments”)**
  - Timeline panel showing moments linked to chat messages.
  - One-click "Go back to before AI changed X".
- **7.3 Trash & Provenance**
  - Implement a Trash system for deletions.
  - Store "Why" for every AI change (prompt rationale).

---

## Phase 8: Safe Apply Workflow (Staging & Merge)
**Goal:** Enhanced control over how AI changes are integrated.

- **8.1 Staging Area (“Proposed Changes”)**
  - AI writes into a staged virtual layer by default in Confirmation Mode.
- **8.2 Partial Apply & Conflict Detection**
  - Allow selecting specific diff hunks to apply.
  - Detect manual vs AI edit collisions and provide a 3-way merge UI.

---

## Phase 9: Advanced Preview & Device Lab
**Goal:** High-fidelity testing across viewports.

- **9.1 Responsive Presets & Resizable Viewport**
  - Device toolbar with presets (Mobile/Tablet/Desktop) and Safe Area simulation.
  - Drag-resize with breakpoint markers.
- **9.2 Multi‑Format Preview**
  - Split view (Mobile + Desktop side-by-side) and Grid view.
- **9.3 Robust Refresh & Diagnostics**
  - Hard reset semantics to clear service worker and bundler cache.
  - Build failure overlays with "Ask AI to fix" integration.

---

## Phase 10: Manual File Management UX
**Goal:** First-class manual control without fighting the AI.

- **10.1 IDE Power Features**
  - Multi-select, drag-drop, project-wide search & replace.
- **10.2 Attribution & Protection**
  - Track `USER_EDIT` vs `AI_EDIT`.
  - "Lock file from AI" toggle to prevent AI from overwriting specific files.

---

## Phase 11: Quality Gates & Testing
**Goal:** Prevent regressions and ensure performance.

- **11.1 One‑Click QA Suite**
  - In-browser Linting, Type checking, and basic accessibility checks.
- **11.2 Regression Protection**
  - "Golden snapshots" to compare visual diffs across versions.

---

## Phase 12: Reliability & Governance
**Goal:** Stability and safety while staying client-side.

- **12.1 Sandboxed Execution**
  - Harden iframe preview and implement a local permissions model.
- **12.2 Recovery & Storage Health**
  - "Safe boot" mode (editor only) for fixing bundler crashes.
  - IndexedDB health monitoring and history compaction.

---

## Phase 13: Zero-Cost Collaboration
**Goal:** Teamwork without platform compute.

- **13.1 Project Bundles**
  - Export/Import single files containing full code + history.
- **13.2 Realtime (User-Owned)**
  - Optional Supabase Realtime for collaborative cursors.

---

## Phase 14: Deployment & Product Maturity ($0 Hosting)
**Goal:** Match Lovable/Bolt's "One-Click Deploy" without platform costs.

- **14.1 Guided Deployment Wizards**
  - Implement a "Deploy to Live" wizard that automates:
    - **GitHub Pages:** For static HTML/JS projects.
    - **Vercel/Netlify/Cloudflare:** Using the user's own connected accounts and the GitHub sync pipeline.
- **14.2 Custom Domain Automation**
  - Provide DNS configuration guidance and automation (via provider APIs like Cloudflare) so users can link their own domains to their deployed apps.

---

## Phase 15: Advanced AI Workflows (Product Polish)
**Goal:** Parity with Lovable's "Targeted Edits" and "Plan Mode".

- **15.1 Targeted "Select-to-Edit" UX**
  - Click-to-select elements in the preview window.
  - AI receives the specific DOM context/code snippet and performs "Targeted Edits" on just that component.
- **15.2 Plan → Implement → Validate Loop**
  - Add a dedicated "Plan Mode" where AI generates a PRD/Checklist before writing code.
  - Automatic error-to-fix pipeline: Preview logs + stack traces are automatically sent back to DUB5 for remediation.
- **15.3 Image-to-UI Generation**
  - Support pasting screenshots/mockups into chat; AI uses vision (if supported by backend) to scaffold the UI layout.

---

## Phase 16: SEO, Health & Design Kits
**Goal:** Final professional-grade tooling.

- **16.1 Lighthouse-Style Health Panel**
  - Client-side checks for Performance, Accessibility, and SEO.
  - Automated Meta-tag and OG-image scaffolding.
- **16.2 Design System Starter Kits**
  - Pre-built tokens and component kits (Tailwind based) that AI can use to maintain visual consistency.

---

## Technical Constraints & Standards
- **Cost:** Strictly $0. No server-side compute for the platform itself.
- **Inference:** Powered by DUB5 AI (External/Free).
- **Execution:** 100% Client-side (Browser).
- **Styling:** Tailwind CSS + Liquid Glass utilities.
- **Persistence:** Local IndexedDB as the primary source of truth.