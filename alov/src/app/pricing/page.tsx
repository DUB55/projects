import { Navbar } from "@/components/navbar"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="pt-32 px-6 max-w-6xl mx-auto space-y-12 text-center">
        <h1 className="text-5xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-xl text-slate-400">Choose the plan that's right for you.</p>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Free</h2>
            <p className="text-4xl font-bold mb-6">$0</p>
            <ul className="space-y-4 text-slate-400 mb-8 flex-1">
              <li>• Unlimited projects</li>
              <li>• Access to basic models</li>
              <li>• Community support</li>
            </ul>
            <button className="w-full py-3 rounded-full bg-white text-black font-bold">Get Started</button>
          </div>
          <div className="p-8 rounded-3xl bg-blue-600 border border-blue-400 flex flex-col scale-105">
            <h2 className="text-2xl font-bold mb-2">Pro</h2>
            <p className="text-4xl font-bold mb-6">$20</p>
            <ul className="space-y-4 text-blue-100 mb-8 flex-1">
              <li>• Priority model access</li>
              <li>• Advanced agents</li>
              <li>• Priority support</li>
            </ul>
            <button className="w-full py-3 rounded-full bg-white text-blue-600 font-bold">Go Pro</button>
          </div>
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Enterprise</h2>
            <p className="text-4xl font-bold mb-6">Custom</p>
            <ul className="space-y-4 text-slate-400 mb-8 flex-1">
              <li>• Custom deployments</li>
              <li>• Dedicated agents</li>
              <li>• 24/7 support</li>
            </ul>
            <button className="w-full py-3 rounded-full bg-white/10 text-white font-bold">Contact Sales</button>
          </div>
        </div>
      </main>
    </div>
  )
}
