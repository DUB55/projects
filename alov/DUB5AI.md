The AI functionality in the DUB5 project is a sophisticated integration that combines **client-side streaming**, **prompt engineering**, and **multimodal data extraction**. 

Below is a breakdown of how it works and how you can replicate it in another website.

### **1. Core Architecture: The AI Service**
The heart of the AI logic is located in [dub5ai.ts](file:///c:/Users/Mohammed/OneDrive%20-%20St%20Micha%C3%ABl%20College/2025-2026/Wiskunde/Uitwerkingen/Projects/Projects/Complete%20Learning%20Platform/apps/web/src/lib/dub5ai.ts). It uses a centralized class called `Dub5AIService` that abstracts all interactions with an external AI API.

- **Central API**: All requests are sent to a single endpoint: `https://chatbot-beta-weld.vercel.app/api/chatbot`.
- **Task-Based Methods**: Instead of writing raw prompts everywhere, the service has dedicated methods like `generateLearningSet`, `generatePracticeTest`, and `generateStudyPlan`.
- **JSON Enforcement**: For structured features (like quizzes), the service explicitly tells the AI to return **raw JSON** and then parses that JSON on the client side.

### **2. Streaming Logic (Real-time Chat)**
To make the AI feel fast, DUB5 uses **Streaming**. Instead of waiting for the full response, it displays chunks of text as they arrive.

- **Server-Sent Events (SSE)**: The API sends data in a stream format (starting with `data:`).
- **Chunk Processing**: The `streamRequest` method in [dub5ai.ts](file:///c:/Users/Mohammed/OneDrive%20-%20St%20Micha%C3%ABl%20College/2025-2026/Wiskunde/Uitwerkingen/Projects/Projects/Complete%20Learning%20Platform/apps/web/src/lib/dub5ai.ts#L19) uses a `ReadableStream` reader to decode these chunks and update the UI in real-time via a callback (`onChunk`).

### **3. Context Injection (The "Learning" Part)**
DUB5 is powerful because it doesn't just "chat"—it uses your specific content as context. This is achieved through **System Prompts**.

- **Document Synthesis**: When you select documents, the [AIChatContent](file:///c:/Users/Mohammed/OneDrive%20-%20St%20Micha%C3%ABl%20College/2025-2026/Wiskunde/Uitwerkingen/Projects/Projects/Complete%20Learning%20Platform/apps/web/src/app/ai-chat/page.tsx#L311) function injects the text of those documents into the "System" message.
- **YouTube/Files**: In [generate.ts](file:///c:/Users/Mohammed/OneDrive%20-%20St%20Micha%C3%ABl%20College/2025-2026/Wiskunde/Uitwerkingen/Projects/Projects/Complete%20Learning%20Platform/apps/web/src/app/actions/generate.ts), the app extracts text from YouTube transcripts or uploaded files and passes that text as the "Context" for generating flashcards or summaries.

### **4. Multimodal Data Extraction**
To use AI with your own files, DUB5 uses [document-parser.ts](file:///c:/Users/Mohammed/OneDrive%20-%20St%20Micha%C3%ABl%20College/2025-2026/Wiskunde/Uitwerkingen/Projects/Projects/Complete%20Learning%20Platform/apps/web/src/lib/document-parser.ts):
- **PDFs**: Uses `pdf-parse` to turn PDF buffers into raw text.
- **Images (OCR)**: Uses `tesseract.js` to read text from images (like photos of textbooks).
- **YouTube**: Uses a custom utility to fetch transcripts.

---

### **How to Replicate This in Your Website**

To build this yourself, follow these steps:

#### **Step 1: Create a Service Wrapper**
Don't call OpenAI or Anthropic directly from your components. Create a service file (like `dub5ai.ts`) that handles:
1.  **Authentication**: Adding your API keys (usually done on a backend proxy).
2.  **Streaming**: Handling the `ReadableStream`.
3.  **Error Handling**: Logging errors consistently.

#### **Step 2: Master Prompt Engineering**
For every feature, define a "Template". For a Quiz generator, your prompt should look like this:
```typescript
const prompt = `Create a quiz about "${topic}". 
Return ONLY a JSON array: [{"question": "...", "options": ["a", "b"], "answer": "a"}]`;
```

#### **Step 3: Handle Streaming in the UI**
In your React/Next.js frontend, use a state variable for the message content and update it as chunks arrive:
```typescript
const [content, setContent] = useState("");

await myAiService.chat(messages, (chunk) => {
    setContent(prev => prev + chunk); // This creates the "typing" effect
});
```

#### **Step 4: Use a Backend Proxy**
**Crucial for Security:** Never put your OpenAI/AI API keys in the frontend. 
1.  Your frontend calls **your own** API route (e.g., `/api/ai`).
2.  Your API route adds the API Key and calls the LLM.
3.  Your API route streams the response back to the frontend.

#### **Step 5: Libraries to Install**
If you want to support files like DUB5 does:
- `npm install pdf-parse` (for PDFs)
- `npm install tesseract.js` (for Images/OCR)
- `npm install ai` (Vercel AI SDK - highly recommended for easier streaming)