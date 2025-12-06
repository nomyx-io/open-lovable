# Browser Testing Tool

The AI Browser Testing Tool allows the AI agent to interact with and test applications it builds in real-time. This provides visual feedback through screenshots and console log access, enabling the AI to verify functionality and debug issues.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │   Chat Panel    │  │   BrowserTest    │  │ PreviewPanel   │  │
│  │   (messages)    │  │     Panel        │  │  (sandbox)     │  │
│  └─────────────────┘  └──────────────────┘  └────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                         API Layer                                │
│  ┌───────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │ /api/browser/ │  │ /api/browser│  │ /api/browser/       │    │
│  │   session     │  │   /action   │  │   execute-tool      │    │
│  └───────────────┘  └─────────────┘  └─────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                      Service Layer                               │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│  │  BrowserSessionManager  │  │    BrowserToolExecutor       │  │
│  │  (session management)   │  │    (AI tool parsing)         │  │
│  └─────────────────────────┘  └──────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Puppeteer    │
                    │   (headless)    │
                    └─────────────────┘
```

## Features

### 1. Stateful Browser Sessions
- Sessions persist across multiple AI interactions
- Automatic cleanup of idle sessions
- Support for multiple concurrent sessions

### 2. Visual Feedback
- Screenshots captured after each action
- Full-page screenshot capability
- Screenshot history maintained in store

### 3. Console Log Capture
- Real-time console log streaming
- Captures log, warn, error, info, and debug messages
- Captures uncaught errors and promise rejections

### 4. Network Activity Monitoring
- Request/response tracking
- Failed request detection
- Network timing information

## API Endpoints

### Session Management

#### Create Session
```
POST /api/browser/session
```
Body:
```json
{
  "sandboxId": "optional-sandbox-id",
  "initialUrl": "https://example.com",
  "viewportWidth": 1280,
  "viewportHeight": 800
}
```

#### List Sessions
```
GET /api/browser/session
```

#### Get Session Info
```
GET /api/browser/session/[id]
```

#### Close Session
```
DELETE /api/browser/session/[id]
```

### Browser Actions

#### Execute Action
```
POST /api/browser/action
```
Body:
```json
{
  "sessionId": "browser-xxx",
  "action": "click",
  "params": {
    "selector": "button.submit"
  }
}
```

Supported actions:
- `navigate` - Navigate to URL
- `click` - Click element
- `type` - Type text into input
- `hover` - Hover over element
- `select` - Select dropdown option
- `scroll` - Scroll page
- `wait` - Wait for time/selector
- `evaluate` - Execute JavaScript
- `screenshot` - Take screenshot
- `goBack` - Browser back
- `goForward` - Browser forward
- `refresh` - Refresh page

#### Take Screenshot
```
POST /api/browser/screenshot
```
Body:
```json
{
  "sessionId": "browser-xxx",
  "fullPage": false
}
```

#### Get Console Logs
```
GET /api/browser/console?sessionId=xxx&since=timestamp
```

### AI Tool Execution

#### Execute Tool Calls from AI Content
```
POST /api/browser/execute-tool
```
Body:
```json
{
  "content": "<browser_test action=\"click\" selector=\"button\" />",
  "sandboxUrl": "https://sandbox-url.com",
  "sessionId": "optional-session-id"
}
```

## AI Integration

The AI uses `<browser_test>` XML tags to execute browser actions:

### Navigation
```xml
<browser_test action="navigate" url="/" />
```

### Click
```xml
<browser_test action="click" selector="button.submit" />
```

### Type
```xml
<browser_test action="type" selector="input#email" text="test@example.com" />
```

### Screenshot
```xml
<browser_test action="screenshot" fullPage="true" />
```

### Wait
```xml
<browser_test action="wait" waitMs="1000" />
<browser_test action="wait" waitForSelector=".loaded" />
```

### Evaluate JavaScript
```xml
<browser_test action="evaluate" script="document.title" />
```

## Frontend Components

### BrowserTestPanel
Main component for displaying browser testing session.

```tsx
import { BrowserTestPanel } from '@/components/browser';

<BrowserTestPanel
  sandboxUrl={sandboxData?.url}
  onClose={() => setShowPanel(false)}
/>
```

### Browser Store
Zustand store for managing browser state.

```tsx
import { useBrowserStore, browserApi } from '@/lib/stores';

// Access state
const { session, consoleLogs, currentScreenshot } = useBrowserStore();

// API calls
const session = await browserApi.createSession({ sandboxUrl });
const result = await browserApi.executeAction(sessionId, 'click', { selector: 'button' });
```

## Configuration

### Environment Variables
No additional environment variables are required. The browser testing tool uses Puppeteer which runs in headless mode by default.

### BrowserManagerConfig
Configuration options in `lib/browser/types.ts`:

```typescript
interface BrowserManagerConfig {
  maxSessions: number;           // Default: 5
  sessionIdleTimeout: number;    // Default: 10 minutes
  maxConsoleBufferSize: number;  // Default: 500
  maxNetworkBufferSize: number;  // Default: 200
  defaultViewport: { width: number; height: number };
  headless: boolean;             // Default: true
  screenshotQuality: number;     // Default: 80 (JPEG quality)
}
```

## Best Practices

### For AI Usage
1. **Take initial screenshot** - Always capture the starting state
2. **Use specific selectors** - Prefer IDs and data-testid attributes
3. **Wait for dynamic content** - Use wait actions after async operations
4. **Check console logs** - Look for errors after each action
5. **Test incrementally** - Verify each step before proceeding

### For Development
1. **Handle session cleanup** - Close sessions when no longer needed
2. **Monitor memory usage** - Puppeteer can be memory-intensive
3. **Use timeouts wisely** - Balance responsiveness with reliability
4. **Log actions** - Track what the AI is testing

## Troubleshooting

### Common Issues

#### Session Creation Fails
- Check if maximum session limit is reached
- Verify Puppeteer is installed correctly
- Check system memory availability

#### Screenshots are Black
- Page may not have loaded completely
- Add wait actions before screenshots
- Check for JavaScript errors in console

#### Actions Timeout
- Selector may not match any elements
- Page may be slow to respond
- Increase timeout values

#### Console Logs Missing
- Script injection may have failed
- Page may have strict CSP headers
- Check for script errors

## File Structure

```
lib/browser/
├── types.ts                    # Type definitions
├── browser-session-manager.ts  # Session management
├── browser-tool-executor.ts    # AI tool parsing
└── index.ts                    # Exports

app/api/browser/
├── session/
│   ├── route.ts               # Create/list sessions
│   └── [id]/
│       └── route.ts           # Get/delete session
├── action/
│   └── route.ts               # Execute actions
├── screenshot/
│   └── route.ts               # Take screenshots
├── console/
│   └── route.ts               # Get console logs
└── execute-tool/
    └── route.ts               # AI tool execution

components/browser/
├── BrowserTestPanel.tsx       # Main UI component
└── index.ts                   # Exports

lib/stores/
└── browser-store.ts           # Zustand store

lib/ai/system-prompts/
└── browser-tool-prompt.ts     # AI instructions
```

## Future Improvements

1. **Video recording** - Record session playback
2. **Visual regression testing** - Compare screenshots
3. **Mobile emulation** - Test responsive layouts
4. **Network throttling** - Test slow connections
5. **Accessibility audits** - Built-in a11y testing
6. **Performance metrics** - Capture Core Web Vitals