import { NextResponse } from "next/server"
import { selectModel } from "@/lib/ai/routing"

type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const messages = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : []
  const settings = body.settings ?? {}
  const selected = selectModel({
    mode: settings.performanceMode,
    userSelectedModel: settings.modelId ?? null,
    allowSlowInfiniteMode: settings.allowSlowInfiniteMode ?? false
  })
  const last = messages[messages.length - 1]
  const prompt = typeof last?.content === "string" ? last.content : ""
  const response = [
    `Using ${selected.model.label} (${selected.source})`,
    "Chat mode is active with no code generation.",
    prompt ? `You asked: ${prompt}` : "Send a message to begin."
  ].join("\n")
  return NextResponse.json({
    message: {
      role: "assistant",
      content: response
    },
    selectedModel: selected
  })
}
