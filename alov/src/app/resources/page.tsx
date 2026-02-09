import { Navbar } from "@/components/navbar"

export default function Resources() {
  return (
    <div className="relative min-h-screen">
      <div className="landing-bg fixed inset-0 z-0" />
      <Navbar />
      <div className="relative z-10 pt-32 px-6 max-w-4xl mx-auto space-y-12">
        <h1 className="text-5xl font-bold">Resources</h1>
        <p className="text-xl text-muted-foreground">Everything you need to master Aether.</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {["Documentation", "Tutorials", "API Reference", "Templates", "Showcase", "Blog"].map((item) => (
            <div key={item} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
              <h3 className="text-lg font-bold">{item}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
