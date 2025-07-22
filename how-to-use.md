# How to Use PostCrawl MCP Server with MCP Inspector

This guide shows you how to connect to and use the PostCrawl MCP server using MCP Inspector.

## Step-by-Step Instructions

### 1. Install MCP Inspector

Install the MCP Inspector from the [official docs](https://modelcontextprotocol.io/docs/tools/inspector)

### 2. Launch MCP Inspector

Run this command and get the local URL:

```bash
npx @modelcontextprotocol/inspector
```

![MCP Inspector in terminal](./images/mcp-inspector-terminal.png)

### 3. Open Inspector Interface

Go to the URL from step 2 and select `Streamable HTTP` for `Transport Type` from the top left:

![Select Streamable HTTP](./images/mcp-inspector-streamable-http.png)

### 4. Enter Server URL

Provide `https://postcrawl.com/mcp` in the `URL` field:

![Enter PostCrawl URL](./images/mcp-inspector-url.png)

⚠️ **IMPORTANT**: Use `https://postcrawl.com/mcp` NOT `https://edge.postcrawl.com/mcp`

### 5. Set Up Authentication

Expand the `Authentication` section and create an API key from [PostCrawl platform](https://platform.postcrawl.com/ideaape-pll49AK/settings/api-keys):

- Copy your API Key and paste it in Bearer Token field
- Add `Authorization` in the `Header Name` field

![Authentication and API Key Setup](./images/mcp-inspector-auth-api-key.png)

### 6. Connect

Click connect and you're ready to go:

![Connected Successfully](./images/mcp-inspector-connected.png)

### 7. View Available Tools

Once connected, you can see the tools by clicking here:

![View Tools](./images/mcp-inspector-tools.png)

### 8. Select a Tool

Click on any of the tools:

![Select Tool](./images/mcp-inspector-select-tool.png)

### 9. Configure Parameters

Provide your query and make sure to include the social_platforms parameter:

![Configure Parameters](./images/mcp-inspector-parameters.png)

### 10. Run Tool

Click `run_tool` and see the results! 🚀

![Run Tool](./images/mcp-inspector-results.png)

## Key Points

- Always use `https://postcrawl.com/mcp` as the server URL
- Include `social_platforms` parameter (e.g., `["reddit", "tiktok"]`)
- The `Authorization` header name is required for authentication
- Use your actual PostCrawl API key as the Bearer token