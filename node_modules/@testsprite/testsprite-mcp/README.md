# TestSprite MCP Server

![npm version](https://img.shields.io/npm/v/@testsprite/testsprite-mcp?color=blue)
![license](https://img.shields.io/npm/l/@testsprite/testsprite-mcp)
![downloads](https://img.shields.io/npm/dm/@testsprite/testsprite-mcp)

**Let your AI code - we'll make it work**

This npm package provides the Model Context Protocol (MCP) server for TestSprite, enabling AI assistants in your IDE to automatically test, debug, and fix your code. No manual test writing, no complex prompts, no testing expertise required.

> **✨ Recognition**: TestSprite has been recognized as one of the [Top 10 AI tools of 2025 on Product Hunt](https://www.producthunt.com/products/testsprite).

## Prerequisites

Before getting started, ensure you have:

- **Compatible IDE** - Cursor or VSCode with MCP support
- **TestSprite Account** - [Sign up for free](https://www.testsprite.com/auth/cognito/sign-up)
- **API Key** - Get yours from [TestSprite API Key Page](https://www.testsprite.com/dashboard/settings/apikey)

## What This Package Provides

* **MCP Server** - Model Context Protocol server for IDE integration
* **One-Command Testing** - Just say "Help me test this project with TestSprite"
* **AI-Driven** - Automatically generates PRDs, test plans, and test code
* **IDE Integration** - Works with Cursor, VSCode, and other MCP-compatible editors
* **Cloud Execution** - Tests run in secure TestSprite cloud environments

For detailed features and capabilities, see our [full documentation](https://docs.testsprite.com/).

## 10-Minute Demo Video

[![TestSprite MCP Demo](https://img.youtube.com/vi/yLQdORqPl3s/maxresdefault.jpg)](https://youtu.be/yLQdORqPl3s)

Watch TestSprite automatically test an entire project with just one command.

## Installation

### NPM Installation

```bash
# Global installation (recommended)
npm install -g @testsprite/testsprite-mcp@latest

# Or use directly with npx
npx @testsprite/testsprite-mcp@latest
```

## IDE Configuration

Add TestSprite MCP Server to your IDE's MCP configuration:

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

**For detailed setup instructions for your specific IDE:**
- [Cursor Setup](https://docs.testsprite.com/mcp/installation#for-cursor) 
- [VSCode Setup](https://docs.testsprite.com/mcp/installation#for-vscode)
- [Other IDEs](https://docs.testsprite.com/mcp/installation#for-other-mcp-compatible-ides)

## Usage

Once configured, simply drag your project into the chat and say:

```
Help me test this project with TestSprite
```

TestSprite will automatically:
1. Analyze your code structure and provided PRD
2. Generate test plans and test code
3. Execute tests in the cloud
4. Provide detailed results and fix suggestions

**For comprehensive usage examples and advanced features, see our [documentation](https://docs.testsprite.com/mcp/examples).**

## What TestSprite Tests

- **Functional Testing** - Core business logic and user workflows
- **Error Handling Testing** - Exception handling and error recovery
- **Security Testing** - Vulnerability scanning and security validation
- **Authorization & Authentication** - User permissions and access control
- **Boundary Testing** - Input validation and data limits
- **Edge Case Testing** - Unusual scenarios and corner cases
- **Response Content Testing** - Data validation and format verification
- **UI/UX Testing** - User interface interactions and user experience flows

**Supported Technologies**: React, Vue, Angular, Svelte, Next.js, Node.js, Python, Java, Go, Express, FastAPI, Spring Boot, REST APIs, and more.

**For complete testing capabilities and supported frameworks, see our [documentation](https://docs.testsprite.com/mcp/overview).**

## Example Output

```bash
TestSprite Analysis Complete

Generated:
├── Standardized Product Requirements Document (PRD)
├── 16 Frontend Test Cases  
├── 12 Backend Test Cases
├── Tests Execution Reports
└── Comprehensive Test Plan

Coverage: 90%+ Designed Features Delivered
```

## Troubleshooting

**Common Issues:**
- **MCP Server Not Connecting**: Check installation with `npm list -g @testsprite/testsprite-mcp`
- **API Key Issues**: Verify your API key in [TestSprite API Key Page](https://www.testsprite.com/dashboard/settings/apikey)
- **IDE Integration**: Restart your IDE after configuration changes

**For detailed troubleshooting, see our [troubleshooting guide](https://docs.testsprite.com/mcp/troubleshooting).**

## Getting Help

- **Documentation**: [docs.testsprite.com](https://docs.testsprite.com)
- **Support & Collaboration**: [Contact us](https://calendly.com/contact-hmul/schedule)
- **Email us**: contact@testsprite.com
- **Live Chat**: Available in the dashboard