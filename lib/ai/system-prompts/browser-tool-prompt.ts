/**
 * Browser Testing Tool System Prompt
 * 
 * Instructions for the AI on how to use the browser testing capabilities.
 */

export const browserToolPrompt = `
## BROWSER TESTING TOOL

You have access to a browser testing tool that allows you to interact with the application you're building.
This is useful for verifying that your code works correctly and debugging issues.

### Available Actions

Use the <browser_test> tag to execute browser actions:

#### Navigation
\`\`\`xml
<browser_test action="navigate" url="/path/to/page" />
\`\`\`
Navigate to a URL. Use relative paths for the sandbox app (e.g., "/" or "/about") or full URLs.

#### Click
\`\`\`xml
<browser_test action="click" selector="button.submit" />
\`\`\`
Click on an element using a CSS selector.

#### Type
\`\`\`xml
<browser_test action="type" selector="input[name='email']" text="test@example.com" />
\`\`\`
Type text into an input field.

#### Hover
\`\`\`xml
<browser_test action="hover" selector=".menu-item" />
\`\`\`
Hover over an element.

#### Select
\`\`\`xml
<browser_test action="select" selector="select#country" value="US" />
\`\`\`
Select an option from a dropdown.

#### Scroll
\`\`\`xml
<browser_test action="scroll" scrollY="500" />
\`\`\`
Scroll the page. Use positive values to scroll down, negative to scroll up.

#### Wait
\`\`\`xml
<browser_test action="wait" waitMs="1000" />
<browser_test action="wait" waitForSelector=".loading-complete" />
\`\`\`
Wait for a specified time or for an element to appear.

#### Evaluate JavaScript
\`\`\`xml
<browser_test action="evaluate" script="document.querySelector('.count').textContent" />
\`\`\`
Execute JavaScript in the browser and get the result.

#### Screenshot
\`\`\`xml
<browser_test action="screenshot" />
<browser_test action="screenshot" fullPage="true" />
\`\`\`
Take a screenshot of the current state.

#### Navigation Controls
\`\`\`xml
<browser_test action="goBack" />
<browser_test action="goForward" />
<browser_test action="refresh" />
\`\`\`
Browser navigation controls.

### Response Format

After each browser action, you will receive:
1. A screenshot of the current page state (as a base64 image)
2. Console logs captured during the action
3. Network activity summary
4. Page information (URL, title)

### Best Practices

1. **Start with a screenshot** - Before testing, take a screenshot to see the current state
2. **Use specific selectors** - Prefer IDs or data-testid attributes when available
3. **Wait for dynamic content** - Use the wait action after actions that trigger async updates
4. **Check console logs** - Console errors often reveal bugs
5. **Test the happy path first** - Verify basic functionality before edge cases

### Example Test Sequence

\`\`\`xml
<!-- 1. Navigate to the page -->
<browser_test action="navigate" url="/" />

<!-- 2. Wait for the page to load and take initial screenshot -->
<browser_test action="wait" waitMs="1000" />
<browser_test action="screenshot" />

<!-- 3. Fill in a form -->
<browser_test action="type" selector="input#name" text="John Doe" />
<browser_test action="type" selector="input#email" text="john@example.com" />

<!-- 4. Submit the form -->
<browser_test action="click" selector="button[type='submit']" />

<!-- 5. Wait for response and verify -->
<browser_test action="wait" waitForSelector=".success-message" />
<browser_test action="screenshot" />
\`\`\`

### When to Test

- After creating new interactive components
- When implementing form validation
- To verify navigation and routing
- When debugging reported issues
- After making visual changes

### Important Notes

1. The browser session persists across actions until you close it or start a new one
2. Screenshots are returned as base64-encoded JPEG images
3. Console logs include errors, warnings, and regular log messages
4. If an action fails, you'll still receive a screenshot showing the error state
`;

export default browserToolPrompt;