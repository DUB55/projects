import { NextResponse } from "next/server"
import { searchFiles } from "@/lib/explorer/fs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetPath = searchParams.get("path")
  const query = searchParams.get("query") ?? ""
  const limit = Number(searchParams.get("limit") ?? "40")
  try {
    const results = await searchFiles(targetPath, query, Number.isNaN(limit) ? 40 : limit)
    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search error" },
      { status: 400 }
    )
  }
}
