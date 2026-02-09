import { writeFileSafe } from "@/lib/explorer/fs"

export type ScaffoldTemplate = "nextjs" | "vite-react" | "static" | "python-fastapi"

export async function scaffolderAgent(template: ScaffoldTemplate, projectName: string) {
  const files: Record<string, string> = {}

  if (template === "nextjs") {
    files["package.json"] = JSON.stringify({
      name: projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint"
      },
      dependencies: {
        "next": "latest",
        "react": "latest",
        "react-dom": "latest",
        "lucide-react": "latest",
        "framer-motion": "latest"
      },
      devDependencies: {
        "typescript": "latest",
        "@types/node": "latest",
        "@types/react": "latest",
        "@types/react-dom": "latest",
        "postcss": "latest",
        "tailwindcss": "latest",
        "autoprefixer": "latest"
      }
    }, null, 2)

    files["src/app/page.tsx"] = `"use client"

import { motion } from "framer-motion"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Aether Generated App
        </h1>
        <p className="text-xl text-slate-400">
          Your project "${projectName}" is ready for development.
        </p>
      </motion.div>
    </main>
  )
}
`

    files["src/app/layout.tsx"] = `import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
`

    files["src/app/globals.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 2, 6, 23;
  --background-end-rgb: 2, 6, 23;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
`

    files["tailwind.config.ts"] = `import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
`

    files["tsconfig.json"] = JSON.stringify({
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] }
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    }, null, 2)
  }

  // Execute scaffold writes
  const generatedFiles: string[] = []
  for (const [path, content] of Object.entries(files)) {
    await writeFileSafe(path, content)
    generatedFiles.push(path)
  }

  return {
    template,
    projectName,
    generatedFiles,
    message: `Scaffolded a new ${template} project named "${projectName}".`
  }
}