/**
 * DUB5 AI Service Integration
 * Implements streaming, prompt engineering, and code generation support.
 */

export type DUB5ChunkCallback = (chunk: string) => void;

export interface DUB5Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DUB5RequestOptions {
  messages: DUB5Message[];
  onChunk?: DUB5ChunkCallback;
  systemPrompt?: string;
  signal?: AbortSignal;
  task?: string;
  params?: Record<string, any>;
}

export class DUB5AIService {
  private static API_URL = "/api/dub5"; // Use local proxy instead of direct URL to avoid CORS/Fetch errors

  /**
   * Core streaming request logic following the DUB5 Integration Protocol
   */
  static async streamRequest(options: DUB5RequestOptions): Promise<string> {
    const { messages, onChunk, systemPrompt, signal } = options;

    // Convert history format and include current request
    const history = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // The protocol requires the last user message to be the 'input'
    const lastUserMessage = history.filter(m => m.role === 'user').pop();
    const input = lastUserMessage ? lastUserMessage.content : "";

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          input: input,
          personality: "coder", // Activated coder personality as per protocol
          thinking_mode: "balanced",
          model: "auto",
          history: history.slice(0, -1), // Previous turns
          system_prompt: systemPrompt // Optional extension
        }),
      });

      if (!response.ok) {
        let errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) errorText = errorJson.error;
        } catch (e) {
          // Not JSON, use raw text
        }
        throw new Error(`DUB5 API Error (${response.status}): ${errorText || response.statusText}`);
      }
      if (!response.body) throw new Error("DUB5 API Error: No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        
        // Handle standard SSE format
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.trim() === "" || !line.startsWith("data: ")) continue;
          
          const rawData = line.slice(6).trim();
          if (rawData === "[DONE]") break;

          try {
            const data = JSON.parse(rawData);
            
            // Handle Content Chunks
            if (data.content) {
              fullResponse += data.content;
              if (onChunk) onChunk(data.content);
            }
            
            // Handle Done Event with parsed files
            if (data.type === "done" && data.files) {
              // The protocol mentioned data: {"type": "done", "files": [...]}
              // We could potentially inject these back into the response as XML tags if needed,
              // but for now we rely on the XML tags in the stream as per "File Extraction Protocol"
              console.log("DUB5 Protocol: Received parsed files in done event", data.files);
            }

            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            // Some chunks might be raw text depending on the SSE implementation
            if (!rawData.startsWith("{")) {
              fullResponse += rawData;
              if (onChunk) onChunk(rawData);
            }
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("DUB5 Streaming Error:", error);
      throw error;
    }
  }

  /**
   * Specialized method for planning execution
   */
  static async planExecution(prompt: string, context: Record<string, string>, onChunk?: DUB5ChunkCallback, signal?: AbortSignal, knowledge?: string): Promise<string> {
    const contextStr = Object.entries(context).length > 0 
      ? `\n\nCURRENT PROJECT FILES:\n${Object.entries(context).map(([path, content]) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``).join('\n\n')}`
      : "\n\nCURRENT PROJECT FILES: (empty project)";

    const knowledgeStr = knowledge ? `\n\n### PROJECT KNOWLEDGE BASE (IMPORTANT CONTEXT)\n${knowledge}` : "";

    const systemPrompt = `You are Aether AI, an advanced autonomous web app builder.
You are currently in PLAN mode. Before writing any code, you must create a detailed, structured plan.
${knowledgeStr}

INSTRUCTIONS:
1. Analyze the user request and the current project context.
2. Break down the task into logical steps.
3. If new files are needed, specify their purpose and structure.
4. If modifying existing files, explain the intended changes.
5. Use <file path="filepath">code</file> to propose changes.
6. Use <shell_command>command</shell_command> to execute shell commands.
7. Use <delete_file path="filepath" /> to delete files.
8. Use <rename_file from="oldpath" to="newpath" /> to rename files.

Your plan should be concise but comprehensive. Focus on high-quality, modern, and beautiful code.`;

    return this.streamRequest({
      messages: [{ role: "user", content: prompt + contextStr }],
      onChunk,
      systemPrompt,
      signal,
      task: "planning"
    });
  }

  /**
   * Specialized method for fast code generation
   */
  static async generateCode(prompt: string, context: Record<string, string>, onChunk?: DUB5ChunkCallback, signal?: AbortSignal, knowledge?: string): Promise<string> {
    const contextStr = Object.entries(context).length > 0 
      ? `\n\nCURRENT PROJECT FILES:\n${Object.entries(context).map(([path, content]) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``).join('\n\n')}`
      : "\n\nCURRENT PROJECT FILES: (empty project)";

    const knowledgeStr = knowledge ? `\n\n### PROJECT KNOWLEDGE BASE (IMPORTANT CONTEXT)\n${knowledge}` : "";

    const systemPrompt = `You are Aether AI, an advanced autonomous web app builder.
You are currently in FAST mode. Directly implement the requested changes using the file action tags.
${knowledgeStr}

INSTRUCTIONS:
1. For each file you want to create or update, use:
   <file path="filename">
   // full file content
   </file>
2. For shell commands (like installing packages), use:
   <shell_command>command</shell_command>
3. To delete a file, use:
   <delete_file path="filename" />
4. To rename a file, use:
   <rename_file from="old" to="new" />

Rules:
- Always provide the FULL content of the file in <file>.
- Ensure all code is modern, accessible, and follows best practices.
- Do not explain yourself unless necessary; prioritize implementation.`;

    return this.streamRequest({
      messages: [{ role: "user", content: prompt + contextStr }],
      onChunk,
      systemPrompt,
      signal,
      task: "code-generation"
    });
  }
}
