import { Navbar } from "@/components/navbar"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Join Aether</h1>
            <p className="text-slate-400 mt-2">Start building the future today</p>
          </div>
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-4">Full Name</label>
              <input type="text" placeholder="John Doe" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-4">Email</label>
              <input type="email" placeholder="name@example.com" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-4">Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50" />
            </div>
            <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 transition-colors">
              Get Started
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm">
            Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
