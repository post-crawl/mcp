# PostCrawl MCP Server

A Cloudflare Workers-based Model Context Protocol (MCP) server that provides access to the PostCrawl API for searching and extracting content from social media platforms, particularly Reddit.

## Overview

PostCrawl is an API service that allows you to search for posts across social media platforms and extract their content. This MCP server provides a seamless interface to the PostCrawl API, enabling AI assistants to:

- Search for posts with customizable parameters
- Extract content from specific URLs
- Retrieve posts with markdown formatting
- Control extraction depth with simplified boolean parameter
- Check API health status

## Quick Start

### Prerequisites

- Node.js (latest LTS version)
- Bun (recommended) or npm
- A Cloudflare account (for deployment)
- PostCrawl API key
- MCP Inspector (for testing)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
bun dev
```

3. The server will be available at `http://localhost:8787`

### Testing with MCP Inspector

1. Start the development server:
```bash
bun dev
```

2. In another terminal, open MCP Inspector:
```bash
npx @modelcontextprotocol/inspector
```

3. Configure MCP Inspector:
- Select **"Streamable HTTP"** as the connection type
- Enter server URL: `localhost:8787/mcp`
- Add authentication header:
  - Header Name: `Authorization`
  - Value: `Bearer YOUR_POSTCRAWL_API_KEY`
- **Important**: Extend request timeouts in inspector settings

4. Connect and test the available tools

## Authentication

The server requires a PostCrawl API key provided as a Bearer token:

```
Authorization: Bearer YOUR_POSTCRAWL_API_KEY
```

## Available MCP Tools

### 1. search
Search for posts across social media platforms.

**Parameters:**
- `query` (string, required): Search query
- `page` (int, optional): Page number (default: 1)
- `results` (int, optional): Number of results (default: 10)
- `social_platforms` (string[], optional): Social platforms to search

### 2. search_and_extract
Search for posts and extract their content in a single operation.

Same parameters as `search` with additional:
- `response_mode` (string, optional): Response format - "raw" or "markdown" (default: "raw")
- `include_comments` (boolean, optional): Include comments and replies (default: false)

### 3. extract
Extract content from specific URLs.

**Parameters:**
- `urls` (string[], required): List of URLs to extract content from
- `include_comments` (boolean, optional): Include comments and replies (default: false)
- `response_mode` (string, optional): Response format - "raw" or "markdown" (default: "raw")

### 4. check_health
Check the health status of the PostCrawl API.

**Parameters:** None

## Development Scripts

- `bun dev` or `npm run dev` - Start development server
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run type-check` - Run TypeScript type checking
- `npm run cf-typegen` - Generate Cloudflare Worker types

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Configuration

The PostCrawl API configuration:
- Base URL: `https://edge.postcrawl.com`
- Default timeout: 30 seconds per request
- Primary platforms: Reddit and TikTok
- Response formats: Raw JSON and Markdown

## Rate Limits

Rate limits depend on your PostCrawl API plan. The server includes appropriate error handling for rate limit responses.

## Architecture

- **Hono**: Web framework for Cloudflare Workers
- **agents/mcp**: MCP agent framework
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **zod**: Runtime type validation
- **PostCrawl API**: Social media content extraction service

## Error Handling

The server provides comprehensive error handling for:
- Missing or invalid authentication
- PostCrawl API errors
- Invalid request parameters
- Network timeouts

## License

This project is licensed under the ISC License.