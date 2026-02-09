import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function gitAgent(action: "init" | "commit" | "status", message?: string, cwd?: string) {
  try {
    let command = ""
    switch (action) {
      case "init":
        command = "git init"
        break
      case "commit":
        command = `git add . && git commit -m "${message || 'AI Update'}"`
        break
      case "status":
        command = "git status"
        break
    }

    const { stdout, stderr } = await execAsync(command, { cwd })
    return {
      success: true,
      stdout,
      stderr,
      message: `Git ${action} successful.`
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Git ${action} failed.`
    }
  }
}
