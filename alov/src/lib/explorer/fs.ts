import fs from "fs/promises"
import path from "path"

export type TreeNode = {
  name: string
  path: string
  type: "file" | "directory"
  children?: TreeNode[]
}

const basePath = path.resolve(process.cwd())

export function resolveSafePath(inputPath: string | null) {
  const resolved = path.resolve(basePath, inputPath ?? ".")
  if (!resolved.startsWith(basePath)) {
    throw new Error("Invalid path")
  }
  return resolved
}

export async function listTree(
  inputPath: string | null,
  depth: number
): Promise<TreeNode> {
  const targetPath = resolveSafePath(inputPath)
  const stats = await fs.stat(targetPath)
  const name = path.basename(targetPath)
  if (!stats.isDirectory()) {
    return { name, path: path.relative(basePath, targetPath), type: "file" }
  }
  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  const children: TreeNode[] = []
  for (const entry of entries) {
    const entryPath = path.join(targetPath, entry.name)
    const rel = path.relative(basePath, entryPath)
    if (entry.isDirectory()) {
      if (depth > 0) {
        const subtree = await listTree(rel, depth - 1)
        children.push(subtree)
      } else {
        children.push({ name: entry.name, path: rel, type: "directory" })
      }
    } else {
      children.push({ name: entry.name, path: rel, type: "file" })
    }
  }
  return { name, path: path.relative(basePath, targetPath), type: "directory", children }
}

export async function readFileSafe(inputPath: string, maxBytes = 200000) {
  const targetPath = resolveSafePath(inputPath)
  const stats = await fs.stat(targetPath)
  if (!stats.isFile()) {
    throw new Error("Not a file")
  }
  const size = Math.min(stats.size, maxBytes)
  const buffer = await fs.readFile(targetPath)
  const sliced = buffer.subarray(0, size)
  return {
    content: sliced.toString("utf-8"),
    size: stats.size,
    truncated: stats.size > maxBytes
  }
}

export async function searchFiles(
  inputPath: string | null,
  query: string,
  limit = 40
) {
  const targetPath = resolveSafePath(inputPath)
  const results: { path: string; name: string }[] = []
  const normalized = query.trim().toLowerCase()
  if (!normalized) return results

  async function walk(currentPath: string) {
    if (results.length >= limit) return
    const entries = await fs.readdir(currentPath, { withFileTypes: true })
    for (const entry of entries) {
      if (results.length >= limit) return
      const entryPath = path.join(currentPath, entry.name)
      const rel = path.relative(basePath, entryPath)
      if (entry.isDirectory()) {
        await walk(entryPath)
      } else if (entry.name.toLowerCase().includes(normalized)) {
        results.push({ path: rel, name: entry.name })
      }
    }
  }

  await walk(targetPath)
  return results
}

export async function writeFileSafe(inputPath: string, content: string) {
  const targetPath = resolveSafePath(inputPath)
  const dir = path.dirname(targetPath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(targetPath, content, "utf-8")
  return { success: true, path: path.relative(basePath, targetPath) }
}

export async function deleteFileSafe(inputPath: string) {
  const targetPath = resolveSafePath(inputPath)
  await fs.rm(targetPath, { recursive: true, force: true })
  return { success: true }
}
