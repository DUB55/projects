import { NextResponse } from "next/server"
import { runAgent } from "@/lib/agents/orchestrator"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const prompt = typeof body.prompt === "string" ? body.prompt : ""
  const contextPaths = Array.isArray(body.contextPaths) ? body.contextPaths : []
  const settings = body.settings ?? {}
  const result = await runAgent({ prompt, contextPaths, settings })
  return NextResponse.json(result)
}
