import { Navbar } from "@/components/navbar"

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="pt-32 px-6 max-w-4xl mx-auto space-y-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold">Enterprise-grade AI platform</h1>
        <p className="text-xl text-slate-400">Scale your AI initiatives with confidence. Secure, private, and powerful.</p>
        <div className="py-12">
          <button className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 transition-colors">
            Talk to Enterprise Sales
          </button>
        </div>
      </main>
    </div>
  )
}
