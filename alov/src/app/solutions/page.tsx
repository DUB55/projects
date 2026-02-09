import { Navbar } from "@/components/navbar"

export default function Solutions() {
  return (
    <div className="relative min-h-screen">
      <div className="landing-bg fixed inset-0 z-0" />
      <Navbar />
      <main className="relative z-10 pt-32 px-6 max-w-4xl mx-auto space-y-12">
        <h1 className="text-5xl font-bold">Solutions</h1>
        <p className="text-xl text-slate-400">Tailored AI development workflows for every team.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">For Startups</h2>
            <p className="text-slate-400">Go from idea to MVP in days, not months. Aether handles the heavy lifting of full-stack development.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">For Enterprise</h2>
            <p className="text-slate-400">Scale your development with autonomous agents that follow your security and style guidelines.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
