# Open Lovable API Documentation

## Base URL

Development: `http://localhost:3000/api`

## Authentication

Most API routes require a valid sandbox session. Some routes require API keys configured in environment variables.

---

## AI Models and Providers

Open Lovable supports multiple AI providers. Configure your preferred providers via environment variables.

### Available Providers

| Provider | Model Prefix | Auth Method | Environment Variables |
|----------|--------------|-------------|----------------------|
| OpenAI | `openai/` | API Key | `OPENAI_API_KEY` |
| Anthropic | `anthropic/` | API Key | `ANTHROPIC_API_KEY` |
| Google AI (Gemini) | `google/` | API Key | `GEMINI_API_KEY` |
| Google Vertex AI | `vertex/` | ADC/Service Account | `GOOGLE_VERTEX_PROJECT`, `GOOGLE_VERTEX_LOCATION` |
| Groq | (no prefix) | API Key | `GROQ_API_KEY` |

### Model IDs

```typescript
// Available models
const models = [
  'openai/gpt-5',
  'anthropic/claude-sonnet-4-20250514',
  'google/gemini-3-pro-preview',
  'vertex/gemini-2.0-flash',
  'vertex/gemini-1.5-pro',
  'vertex/gemini-1.5-flash',
  'moonshotai/kimi-k2-instruct-0905'  // Groq
];
```

### Google Vertex AI Setup

Vertex AI uses Google Cloud's Application Default Credentials (ADC) instead of API keys:

**Local Development:**
```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Login with ADC
gcloud auth application-default login

# Set project
export GOOGLE_VERTEX_PROJECT=your-gcp-project-id
export GOOGLE_VERTEX_LOCATION=us-central1  # Optional
```

**Production (Google Cloud):**
- Use Workload Identity Federation (recommended)
- Or attach a service account to your compute instance

**Production (Non-Google Cloud):**
```bash
# Download service account key from GCP Console
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
export GOOGLE_VERTEX_PROJECT=your-gcp-project-id
```

### Vercel AI Gateway

For simplified multi-provider access, use Vercel AI Gateway:

```bash
AI_GATEWAY_API_KEY=your_gateway_key
```

This provides access to OpenAI, Anthropic, Google, and Groq through a single API key.

---

## Endpoints

### Sandbox Management

#### POST /api/create-ai-sandbox-v2
Create a new sandbox environment.

**Request:**
```json
{
  "model": "anthropic/claude-sonnet-4-20250514",
  "provider": "e2b"
}
```

**Response:**
```json
{
  "success": true,
  "sandboxId": "sandbox_abc123",
  "url": "https://sandbox.e2b.dev/abc123",
  "provider": "e2b"
}
```

#### GET /api/sandbox-status
Check the status of the current sandbox.

**Response:**
```json
{
  "success": true,
  "status": "running",
  "sandboxId": "sandbox_abc123",
  "url": "https://sandbox.e2b.dev/abc123"
}
```

#### POST /api/kill-sandbox
Terminate the current sandbox.

**Response:**
```json
{
  "success": true,
  "message": "Sandbox terminated"
}
```

---

### Code Generation

#### POST /api/generate-ai-code-stream
Generate code using AI. Returns a Server-Sent Events stream.

**Request:**
```json
{
  "prompt": "Create a landing page with hero section",
  "model": "anthropic/claude-sonnet-4-20250514",
  "context": {
    "sandboxId": "sandbox_abc123",
    "conversationContext": {}
  }
}
```

**Response (SSE Stream):**
```
data: {"type":"stream","text":"import React","raw":true}
data: {"type":"stream","text":" from 'react'","raw":true}
data: {"type":"file","path":"src/App.jsx","content":"..."}
data: {"type":"complete","generatedCode":"...","files":[...]}
```

#### POST /api/apply-ai-code-stream
Apply generated code to the sandbox. Returns a Server-Sent Events stream.

**Request:**
```json
{
  "code": "// Generated code here",
  "isEdit": false
}
```

**Response (SSE Stream):**
```
data: {"type":"progress","stage":"parsing","message":"Parsing files..."}
data: {"type":"progress","stage":"writing","message":"Writing files..."}
data: {"type":"complete","success":true,"filesWritten":5}
```

---

### Web Scraping

#### POST /api/scrape-url-enhanced
Scrape a website for content and structure.

**Request:**
```json
{
  "url": "https://example.com",
  "options": {
    "includeScreenshot": true,
    "extractStyles": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  "markdown": "# Example Domain...",
  "html": "<html>...</html>",
  "screenshot": "data:image/png;base64,...",
  "links": [{"text": "More information", "url": "..."}]
}
```

#### POST /api/scrape-screenshot
Capture a screenshot of a URL.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "screenshot": "data:image/png;base64,..."
}
```

#### POST /api/extract-brand-styles
Extract brand colors and styles from a website.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "colors": ["#FF5733", "#333333", "#FFFFFF"],
  "fonts": ["Inter", "system-ui"]
}
```

---

### Package Management

#### POST /api/install-packages
Install npm packages in the sandbox.

**Request:**
```json
{
  "packages": ["lucide-react", "framer-motion"]
}
```

**Response:**
```json
{
  "success": true,
  "installed": ["lucide-react", "framer-motion"],
  "errors": []
}
```

#### POST /api/detect-and-install-packages
Analyze code and install detected dependencies.

**Request:**
```json
{
  "code": "import { motion } from 'framer-motion'"
}
```

**Response:**
```json
{
  "success": true,
  "detected": ["framer-motion"],
  "installed": ["framer-motion"]
}
```

---

### File Operations

#### GET /api/get-sandbox-files
Get all files from the sandbox.

**Response:**
```json
{
  "success": true,
  "files": {
    "src/App.jsx": "import React...",
    "src/index.css": "..."
  }
}
```

#### POST /api/run-command
Run a command in the sandbox.

**Request:**
```json
{
  "command": "npm run build"
}
```

**Response:**
```json
{
  "success": true,
  "stdout": "Build complete",
  "stderr": "",
  "exitCode": 0
}
```

---

### Error Handling

#### POST /api/report-vite-error
Report a Vite build error for analysis.

**Request:**
```json
{
  "error": "Module not found: 'react-router-dom'",
  "file": "src/App.jsx",
  "line": 1
}
```

**Response:**
```json
{
  "success": true,
  "suggestion": "Install react-router-dom: npm install react-router-dom"
}
```

#### GET /api/check-vite-errors
Check for any cached Vite errors.

**Response:**
```json
{
  "hasErrors": false,
  "errors": []
}
```

---

### Search

#### POST /api/search
Search for information using AI.

**Request:**
```json
{
  "query": "How to implement dark mode in React"
}
```

**Response:**
```json
{
  "success": true,
  "results": [...]
}
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `SANDBOX_NOT_FOUND` | 404 | No active sandbox |
| `INVALID_REQUEST` | 400 | Invalid request body |
| `PROVIDER_ERROR` | 500 | AI/Sandbox provider error |
| `RATE_LIMITED` | 429 | Too many requests |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |

---

## Rate Limits

- Code generation: 10 requests/minute
- Web scraping: 20 requests/minute
- File operations: 100 requests/minute

---

## WebSocket Events (Future)

The application uses Server-Sent Events for streaming. Future versions may include WebSocket support for bidirectional communication.

---

## SDK Usage

```typescript
// Example using the project store
import { getProjectStore } from '@/lib/projects';

const store = getProjectStore();
const project = await store.createProject({
  name: 'My Project',
  sourceUrl: 'https://example.com',
  aiModel: 'anthropic/claude-sonnet-4-20250514',
});
```

```typescript
// Example using the template library
import { getTemplateLibrary } from '@/lib/templates';

const library = getTemplateLibrary();
const templates = library.listTemplates({ category: 'landing' });
```

```typescript
// Example using the export manager
import { getExportManager } from '@/lib/export';

const exporter = getExportManager();
const result = await exporter.export(files, { format: 'zip' });