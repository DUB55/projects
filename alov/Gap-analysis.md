# Aether (Alov) vs. Bolt.new & Lovable: Feature Gap Analysis

This document outlines the current limitations of the Aether (Alov) platform compared to industry leaders like Bolt.new and Lovable. It serves as a roadmap for future development to reach parity with professional AI-native IDEs.

## **1. Runtime & Infrastructure**
*   **WebContainer Integration**: Bolt.new uses StackBlitz WebContainers to run a full Node.js environment in the browser. Aether currently *simulates* terminal commands and previews, lacking a real server-side execution environment.
*   **Live Dependency Management**: Lovable and Bolt automatically install npm packages and resolve dependencies in real-time. Aether requires manual simulation of these processes.
*   **Persistent File System**: While Aether uses IndexedDB, professional tools use a virtual file system that mirrors a real Linux environment, allowing for complex build steps (Vite, Next.js, etc.).

## **2. AI Capabilities**
*   **Context Window & Codebase Awareness**: Bolt and Lovable analyze the *entire* project structure for every prompt. Aether's current implementation is more localized to the active file.
*   **Multi-File Refactoring**: Professional tools can modify 10+ files in a single turn to implement a feature (e.g., adding a new API route, updating the store, and creating a UI component).
*   **Error Self-Correction**: While Aether has an "AI Fix" button, Bolt.new automatically detects build errors in the terminal and attempts to fix them without user intervention.

## **3. Version Control & Deployment**
*   **True Git Integration**: Bolt.new allows for real-time branch management and PR creation. Aether currently has a simplified GitHub push simulation.
*   **One-Click Production Deploys**: Lovable integrates directly with Vercel/Netlify for real-time production URLs. Aether simulates the deployment process but doesn't yet trigger a real cloud build.
*   **History Reversion**: The ability to "Time Travel" to any specific AI generation point (a core Bolt feature) is currently absent in Aether.

## **4. UI/UX & Developer Experience**
*   **Collaborative Editing**: Lovable supports multi-user collaboration.
*   **Advanced Debugging**: A full browser-based debugger and console inspection tool (beyond a simple terminal output) are missing.
*   **Component Library Integration**: Bolt/Lovable have native "shadcn/ui" and "Lucide" awareness, often offering drag-and-drop or visual editing capabilities that Aether lacks.

## **5. Integration Ecosystem**
*   **Database Visualizers**: Lovable provides a visual interface for Supabase/PostgreSQL schema management.
*   **Auth Templates**: Pre-built, functional authentication flows (Clerk, Kinde, Supabase Auth) are standard in Bolt.new but require manual setup in Aether.

---

### **Strategic Roadmap for Aether**
1.  **Phase 1**: Integrate a real WebContainer for true Node.js execution.
2.  **Phase 2**: Implement a multi-file AI agent capable of architectural changes.
3.  **Phase 3**: Bridge the gap between simulation and real cloud deployment (Vercel API integration).