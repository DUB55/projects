# DUB5 AI — Universal Integration Guide

Build a client that POSTs JSON `{"input":"<user message>"}` to `https://chatbot-beta-weld.vercel.app/api/chatbot`, accepts the response as a streaming SSE `text/event-stream`, parses incremental `data:` JSON fragments, and supports both conversational flows and one-click AI features (summarize, translate, refactor, extract, etc.). The client must: (1) always send `input`, (2) optionally include a `task`/`params` envelope for non-chat features while remaining backwards-compatible, (3) update the UI progressively while the stream is active, (4) provide abort/retry/backoff and graceful error handling, and (5) support rendering results in different UI patterns (chat bubble, modal result card, file download, inline replacement).

> **Important:** keep the API endpoint exactly as below — `https://chatbot-beta-weld.vercel.app/api/chatbot`.

---

# Purpose & scope

This document is a universal, implementation-ready contract so any client (web, mobile, desktop, or server) or an “AI web app builder” can integrate the DUB5 AI backend. It explains the exact transport, streaming format, client behavior, and how to support **both** streaming chat and single-click AI features (e.g., "Summarize this", "Translate to NL", "Refactor code") — without breaking the simple `{ "input": "..." }` contract.

---

# High-level overview

* **Backend URL (do not change):** `https://chatbot-beta-weld.vercel.app/api/chatbot`
* **Primary mode:** POST JSON; server returns SSE (`text/event-stream`) with multiple `data:` lines.
* **Client goals:** Send user input, optionally instruct a task, read and render streamed fragments progressively, support button-triggered/one-shot AI actions, allow aborting and retrying, and provide safe rendering & persistence.

---

# API contract (exact — required)

* **Endpoint:** `https://chatbot-beta-weld.vercel.app/api/chatbot`
* **Method:** `POST`
* **Request headers:**

  * `Content-Type: application/json`
  * Optional: `Authorization: Bearer <token>` (if you add auth)
* **Minimal request body (always valid):**

```json
{ "input": "user message here" }
```

* **Optional (backwards-compatible) envelope:** Clients MAY include extras; backend is expected to ignore unknown fields (clients must remain safe if server doesn’t read them):

```json
{
  "input": "Please summarize the text below.",
  "task": "summarize",          // optional: "chat", "summarize", "translate", "refactor", "extract", "classify", etc.
  "params": {                   // optional: task-specific params
    "language": "nl",
    "max_length": 300,
    "format": "bullet"
  },
  "context": [ /* optional history or metadata */ ]
}
```

* **Response:** SSE (`Content-Type: text/event-stream`) containing lines beginning with `data:`. Each `data:` line contains a JSON string. Minimal example:

```
data: {"content":"Hello"}
data: {"content":" world"}
data: {"content":"!"}
```

* **Stream end:** Connection close (EOF). Do **not** rely on a special `[DONE]` token unless you add support for it; detect EOF/stream closed.

---

# Universal streaming parsing rules

1. **Accept SSE framing:** Read line-oriented stream; look for lines starting with `data:` and ignore unknown SSE fields (`id:`, `event:`, etc.).
2. **JSON per data line:** Trim `data:` prefix and parse the remainder as JSON. Expect at minimum a `"content"` string fragment.
3. **Fragment concatenation:** Append fragments to `currentMessage` in arrival order; update UI progressively.
4. **Line buffering:** SSE `data:` lines can be split over TCP chunks — buffer until a newline-delimited `data:` line is complete before parsing.
5. **Flexible event fields:** Server may send additional keys (e.g., `type`, `meta`, `fileUrl`, `progress`). Clients should inspect `type` when present:

   * `"type":"content"` → append `content`
   * `"type":"meta"` → update progress indicators / token counts
   * `"type":"action"` → indicates a follow-up instruction (e.g., open modal)
   * `"type":"file"` → contains `fileUrl` or `filename`
6. **Error handling inside stream:** If JSON parse fails for a line, log it, optionally surface a short error in the UI, and continue parsing subsequent lines.
7. **Stream completion:** On EOF — finalize message, remove typing indicator, persist history if needed.

---

# Client responsibilities (universal list)

* **Always send `input`**. If the client supports tasks, include optional `task` and `params` (but server must still accept minimal input-only payloads).
* **Progressive rendering:** Show user message instantly and a typing/loading indicator; append assistant fragments live as they arrive.
* **Support multiple UI patterns:** chat-bubble, modal/panel result, inline replacement, downloadable file; the rendering should be chosen per `task`.
* **Button-triggered AI features:** Buttons or quick-actions must call the same POST endpoint but set `task`/`params` so results can be displayed in an appropriate pattern (e.g., a button "Summarize" sends `task: "summarize"` and displays a modal).
* **Abort/Cancel:** Allow user to cancel in-progress streams (use AbortController or close connections). On cancel, either show partial output labeled "partial result" or discard it per UX choice.
* **Dedup & disable:** Disable duplicate sends while the request is in-flight or implement idempotency handling.
* **Retries & backoff:** Retry transient failures with exponential backoff up to a safe max. If retries may re-run actions with side-effects, prompt the user first.
* **Sanitize & render safely:** Escape/HTML-sanitize streamed text by default. If supporting markdown, use a secure renderer. For images/files, verify URLs before embedding.
* **Persisting history:** Store messages as `{ id, role, content, timestamp, task, params }`. Persist if desired (localStorage, IndexedDB, server).
* **Accessibility & UX:** Use ARIA live regions for progressive text updates; ensure keyboard access to action buttons and abort.
* **Internationalization:** Keep UI strings externalized for translations; accept `params.language` for server hints.

---

# Supporting one-click AI features (UI patterns & under-the-hood)

Clients should reuse the same streaming contract for multiple task types. The UI may present these as buttons, context menus, or inline controls. Under the hood:

* Button click → build payload:

  * Minimal: `{ input: "<selected text or prompt>" }`
  * With task: `{ input: "<...>", task: "summarize", params: { format: "bullet", max_length: 150 } }`
* Send to `https://chatbot-beta-weld.vercel.app/api/chatbot` via POST.
* Show immediate feedback (spinner, toast, or typing indicator).
* Render streaming output in an appropriate layout:

  * **Chat-style:** For conversational responses.
  * **Result card/modal:** For one-shot answers (summaries, translation).
  * **Inline replacement:** For "refactor code" or "rewrite this paragraph".
  * **File link/download:** For exports (`save as .txt`), or if SSE provides a `fileUrl`.
* Allow "rerun" or "regenerate" — reuse last payload but optionally tweak params.

**Examples of button-driven UI flows**

* **Summarize selected text:** User selects text → clicks "Summarize" → client sends `{ input: "<selected>", task:"summarize", params:{ format:"bullet" } }` → displays modal with progressive bullets.
* **Translate paragraph:** Click "Translate to NL" → `{ input:"<text>", task:"translate", params:{ language:"nl" } }` → show translated text inline with a copy button.
* **Refactor code block:** Click "Refactor" → `{ input:"<code>", task:"refactor", params:{ style:"modern", language:"js" } }` → replace code block with streamed refactor.

---

# Example client code (browser) — supports chat + tasks

```js
async function sendToDub5({ input, task=null, params=null, signal=null }) {
  const body = { input };
  if (task) body.task = task;
  if (params) body.params = params;

  const res = await fetch('https://chatbot-beta-weld.vercel.app/api/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  if (!res.ok) throw new Error('Server error: ' + res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let assistantText = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // remainder
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (!line.startsWith('data:')) continue;
      const jsonPart = line.slice(5).trim();
      try {
        const obj = JSON.parse(jsonPart);
        // handle type-aware events
        if (!obj.type || obj.type === 'content') {
          assistantText += obj.content || '';
          // update UI progressively, choose rendering based on `task`
          updateProgressiveOutput(assistantText);
        } else if (obj.type === 'meta') {
          updateMeta(obj.meta);
        } else if (obj.type === 'file') {
          showFileLink(obj.fileUrl, obj.filename);
        } else if (obj.type === 'action') {
          performClientAction(obj.action);
        }
      } catch (err) {
        console.error('SSE parse error', err, jsonPart);
      }
    }
  }
  // stream closed — assistantText is final
  finalizeMessage(assistantText);
}
```

---

# Minimal examples (curl / node / python) — with `task` support

**curl**

```bash
curl -N -X POST "https://chatbot-beta-weld.vercel.app/api/chatbot" \
  -H "Content-Type: application/json" \
  -d '{"input":"Summarize the following: <paste text>", "task":"summarize", "params":{"format":"bullet"}}'
```

**Python (httpx async)**

```py
import httpx, json
async with httpx.AsyncClient(timeout=None) as client:
    r = await client.post("https://chatbot-beta-weld.vercel.app/api/chatbot",
                          json={"input":"Translate to Dutch: Hello world", "task":"translate", "params":{"language":"nl"}})
    async for chunk in r.aiter_text():
        for line in chunk.splitlines():
            if not line.startswith("data:"): continue
            obj = json.loads(line[5:].strip())
            print(obj.get("content",""))
```

---

# Data model recommendation (universal)

Use this model for local/state storage so clients across platforms can interoperate:

```json
{
  "id": "uuid-1234",
  "role": "user|assistant",
  "task": "chat|summarize|translate|refactor|extract|classify|other",
  "content": "text result or fragment",
  "params": { /* optional */ },
  "timestamp": "2025-11-01T12:00:00Z",
  "meta": { "partial": true, "progress": 0.45 }
}
```

---

# Server expectations (what the client assumes)

* Sends HTTP 200 and `Content-Type: text/event-stream`.
* Streams `data:` lines containing JSON objects with at least `content`.
* Flushes after each `data:` message so clients render progressively.
* Closes connection to indicate completion.
* Accepts minimum `{ "input": "..." }` and is tolerant of additional optional fields like `task` and `params`.
* Supports CORS headers for browser clients.

---

# Rendering & UX guidelines

* **Choose rendering by `task`:**

  * `chat` → chat bubble, threaded history
  * `summarize` → compact modal or card with bullets
  * `translate` → inline replacement + copy button
  * `refactor` → code block with diff/highlight
  * `extract` (e.g., entities) → structured list or table
* **Progressive updates:** show partial content inside an ARIA `live` region so screen readers announce updates.
* **Abort feedback:** mark aborted requests clearly and optionally allow the user to keep or discard partial results.
* **Copy/export:** give users buttons to copy, download (.txt/.md/.json), or email results.
* **Error messages:** user-friendly and actionable (e.g., “Network problem — try again”).
* **Security:** by default escape all content; treat links and images carefully.

---

# Security & operational notes

* **Input limits:** enforce sane limits (e.g., max 10k chars).
* **Rate limiting / auth:** protect endpoint from abuse with per-IP or per-user quotas.
* **Proxy buffering:** disable buffering for SSE endpoints (e.g., `proxy_buffering off;`).
* **TLS:** always use HTTPS in production.
* **Sanitization:** server should never emit raw HTML intended to be rendered without escaping. Clients that render markdown should sanitize.
* **Logging & metrics:** track streaming durations, bytes, and errors for observability.

---

# Testing checklist

* Verify streaming with `curl -N`.
* Validate progressive rendering with artificially slow streaming.
* Test behind your real proxy (NGINX/Cloudflare) to ensure no buffering.
* Simulate partial/malformed `data:` lines to ensure client robustness.
* Test client abort behavior and retries.
* Confirm CORS & preflight behavior for browser clients.

---

# Troubleshooting quick guide

* **No stream visible:** confirm `Content-Type` is `text/event-stream` and proxy buffering is off.
* **JSON parse errors:** ensure your client buffers until a full newline-delimited `data:` line.
* **Server closes early:** check server logs for crashes/timeouts and proxy timeouts.
* **UI freezes:** ensure you process stream chunks asynchronously and update UI incrementally; avoid blocking main thread with heavy parsing.

---

# Extensibility & future-proof patterns

* Accept `type` and `meta` keys in SSE JSON to drive richer client behaviors (progress bars, file downloads, actions).
* Support structured `task` options — clients should fall back gracefully if the server ignores them.
* Add `role`, `id`, or `source` in stream messages for multi-part/role streaming.
* If attachments are needed later, server may send `type:"file"` with `fileUrl` — clients should fetch separately or embed securely.

---

# Quick integration steps (summary)

1. POST `{ "input": "..." }` to `https://chatbot-beta-weld.vercel.app/api/chatbot`.
2. Optionally include `{ "task": "...", "params": {...} }` — client must remain compatible if server ignores extras.
3. Read the response as SSE, parse `data:` JSON lines, append `content` progressively.
4. Render result according to `task` (chat bubble, modal, inline, file).
5. Support abort, retry, sanitization, and accessibility.
