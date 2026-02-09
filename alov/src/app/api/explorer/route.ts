import { NextResponse } from "next/server"
import { listTree, readFileSafe, resolveSafePath, writeFileSafe, deleteFileSafe } from "@/lib/explorer/fs"
import fs from "fs/promises"
import path from "path"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetPath = searchParams.get("path")
  const depth = Number(searchParams.get("depth") ?? "2")
  try {
    const resolved = resolveSafePath(targetPath)
    const stats = await fs.stat(resolved)
    if (stats.isFile()) {
      const file = await readFileSafe(path.relative(process.cwd(), resolved))
      return NextResponse.json({
        type: "file",
        path: path.relative(process.cwd(), resolved),
        content: file.content,
        size: file.size,
        truncated: file.truncated
      })
    }
    const tree = await listTree(path.relative(process.cwd(), resolved), Number.isNaN(depth) ? 2 : depth)
    return NextResponse.json({ type: "directory", tree })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Explorer error" },
      { status: 400 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { path: targetPath, content } = await request.json()
    if (!targetPath) throw new Error("Path is required")
    const result = await writeFileSafe(targetPath, content ?? "")
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Write error" },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetPath = searchParams.get("path")
    if (!targetPath) throw new Error("Path is required")
    const result = await deleteFileSafe(targetPath)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete error" },
      { status: 400 }
    )
  }
}
