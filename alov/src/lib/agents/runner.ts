import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function runnerAgent(command: string, cwd?: string) {
  try {
    // In a real app, we'd use a WebSocket to stream logs
    // For now, we'll return the execution result
    const { stdout, stderr } = await execAsync(command, { cwd })
    return {
      success: true,
      stdout,
      stderr,
      message: `Executed: ${command}`
    }
  } catch (error: any) {
    return {
      success: false,
      stdout: error.stdout,
      stderr: error.stderr,
      error: error.message,
      message: `Failed to execute: ${command}`
    }
  }
}
