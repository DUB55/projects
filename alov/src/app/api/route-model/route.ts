import { NextResponse } from "next/server"
import { selectModel, checkLocalModelHealth } from "@/lib/ai/routing"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const localAvailability = await checkLocalModelHealth()
  const result = selectModel({ ...body, localAvailability })
  return NextResponse.json(result)
}
