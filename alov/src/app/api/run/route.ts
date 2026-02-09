import { NextRequest, NextResponse } from "next/server"
import { runnerAgent } from "@/lib/agents/runner"

export async function POST(req: NextRequest) {
  try {
    const { command, cwd } = await req.json()
    
    if (!command) {
      return NextResponse.json({ error: "No command provided" }, { status: 400 })
    }

    // Safety check: Don't allow dangerous commands in this demo
    const forbidden = ["rm -rf /", "format", "mkfs", "> /dev/"]
    if (forbidden.some(f => command.includes(f))) {
      return NextResponse.json({ error: "Forbidden command detected" }, { status: 403 })
    }

    const result = await runnerAgent(command, cwd)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
