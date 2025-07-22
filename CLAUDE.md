# PostCrawl MCP Server Development Guide

## Overview
This is a Model Context Protocol (MCP) server implementation for PostCrawl, providing AI assistants with tools to search and extract content from social media platforms (Reddit and TikTok). Built on Cloudflare Workers with Hono framework.

## Architecture
- **Hono**: Web framework for routing and middleware
- **MCP SDK**: Protocol implementation for AI tool integration
- **Zod**: Runtime validation for tool parameters
- **PostCrawl Client**: Internal API client for PostCrawl services

## Key Technologies
- **Cloudflare Workers**: Serverless execution environment
- **TypeScript**: Full type safety with strict mode
- **@post-crawl/extraction-schemas**: Shared types for extraction and search operations

## Authentication Flow
1. MCP client sends Bearer token in Authorization header
2. Token is extracted and validated in request handlers
3. Token is passed to PostCrawl API for authentication
4. Errors return appropriate JSON-RPC error responses

## Tool Schemas
All tools use Zod schemas for parameter validation:
- `socialPlatformSchema`: Enum of supported platforms (reddit, tiktok)
- `responseModeSchema`: Enum of response formats (raw, markdown)
- Parameters are validated before API calls
- **Important**: Tool parameters use snake_case (e.g., `social_platforms`, `include_comments`, `response_mode`) to match API expectations

## Available Tools

### search
Search across social media platforms.
- Input: query, page, results, social_platforms[]
- Output: Array of search results with title, url, snippet, date (formatted string), imageUrl
- Note: Dates are returned as formatted strings (e.g., "Dec 28, 2024")

### search_and_extract
Combined search and content extraction.
- Input: Same as search + response_mode, include_comments
- Output: Array of extracted posts

### extract
Extract content from specific URLs.
- Input: urls[], response_mode, include_comments
- Output: Array of posts with content

### check_health
Health check for PostCrawl API.
- No parameters required
- Returns API status

## Development Guidelines

### Type Safety
- Import types from `@post-crawl/extraction-schemas` for consistency
- Use `SocialPlatform`, `ResponseMode`, and `SearchResult` types throughout
- Validate all inputs with Zod schemas
- API responses use the shared schema types (e.g., `SearchResult[]` for search endpoints)

### Error Handling
- Uses `@post-crawl/api-errors` package for consistent error handling
- All errors include request IDs for tracing
- ApiError instances are mapped to appropriate JSON-RPC error codes:
  - Authentication errors → -32000
  - Validation errors → -32602 (Invalid params)
  - Rate limit errors → -32000 with retry information
  - Internal errors → -32603
- Error responses include detailed information:
  ```json
  {
    "code": -32000,
    "message": "Technical error message",
    "data": {
      "type": "rate_limit_error",
      "code": "rate_limit_exceeded",
      "request_id": "req_xyz",
      "user_message": "User-friendly message",
      "details": { /* error-specific data */ },
      "doc_url": "https://docs.postcrawl.com/errors#rate_limit_exceeded"
    }
  }
  ```

### Code Style
- Biome formatting with tab indentation
- Explicit types for all function parameters
- Organized imports (external, then local)
- Descriptive variable and function names

### Environment Variables
- `POSTCRAWL_API_URL`: Override default API URL (defaults to https://edge.postcrawl.com)
- Set via Cloudflare Workers environment bindings

## Configuration
- Default request timeout: 300 seconds (5 minutes) - suitable for large extraction operations
- Can be overridden when creating PostCrawlClient instance

## Testing
Run tests with: `bun run test`
- Tool registration validation
- API client request/response handling
- Error scenarios and edge cases
- Authentication flow

## Common Patterns

### Tool Registration
```typescript
server.tool(
  "tool_name",
  {
    param: z.string().describe("Description"),
    // Use imported schemas for consistency - note snake_case for API compatibility
    social_platforms: z.array(socialPlatformSchema).optional(),
    response_mode: responseModeSchema.optional(),
    include_comments: z.boolean().optional()
  },
  async (params) => {
    // Implementation
  }
);
```

### Error Response in Tools
```typescript
// Tools return enhanced error information when ApiError is caught
if (error instanceof ApiError) {
  return {
    content: [{
      type: "text",
      text: `Error: ${error.userMessage}\n\nDetails: ${JSON.stringify({
        type: error.type,
        code: error.code,
        request_id: error.requestId,
        details: error.details
      }, null, 2)}`
    }]
  };
}
```

### Client Error Handling
- PostCrawlClient automatically parses API error responses
- Maps error types to appropriate ApiError builders
- Preserves request IDs and error details from API
- Handles rate limit errors with retry information
- Provides field-level validation error details

### Validation
- Empty socialPlatforms arrays are rejected
- At least one platform must be specified when provided
- Response modes default to "raw" if not specified

## Deployment
Deploy to Cloudflare Workers:
```bash
bun run deploy
```

## Integration Notes
- MCP clients connect via HTTP transport
- Authentication required for all tool calls
- Tools are stateless - no session management
- Rate limits inherited from PostCrawl API tier
- All errors follow PostCrawl API error format with:
  - Consistent error types and codes
  - Request ID tracking for debugging
  - User-friendly error messages
  - Documentation URLs for each error code