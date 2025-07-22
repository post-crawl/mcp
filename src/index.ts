import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiError, Errors, generateRequestId } from "@post-crawl/api-errors";
import {
	responseModeSchema,
	socialPlatformSchema,
} from "@post-crawl/extraction-schemas";
import { Hono } from "hono";
import { z } from "zod";
import { PostCrawlClient } from "./postcrawl-client";
import type { ExtractRequest, SearchPostRequest, SearchRequest } from "./types";
import { homeContent, layout } from "./utils";

// Extract enum values for use in JSON schema definitions
const socialPlatformValues = socialPlatformSchema._def.values as string[];
const responseModeValues = responseModeSchema._def.values as string[];

const app = new Hono<{
	Bindings: Env;
}>();

// Create the MCP server with tools
function createServer(apiKey: string): McpServer {
	const server = new McpServer({
		name: "PostCrawl",
		version: "1.0.0",
	});

	const getPostCrawlClient = (): PostCrawlClient => {
		return new PostCrawlClient({
			apiKey: apiKey,
		});
	};

	// Search tool
	server.tool(
		"search",
		{
			query: z.string().describe("Search query"),
			page: z.number().optional().describe("Page number"),
			results: z.number().optional().describe("Number of results"),
			social_platforms: z
				.array(socialPlatformSchema)
				.describe("Social media platforms to search"),
		},
		async (params) => {
			try {
				const searchRequest: SearchRequest = {
					query: params.query,
					page: params.page || 1,
					results: params.results || 10,
					social_platforms: params.social_platforms,
				};

				const response = await getPostCrawlClient().search(searchRequest);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(response, null, 2),
						},
					],
				};
			} catch (error) {
				let errorMessage = "Unknown error occurred";
				let errorDetails = {};

				if (error instanceof ApiError) {
					errorMessage = error.userMessage;
					errorDetails = {
						type: error.type,
						code: error.code,
						request_id: error.requestId,
						details: error.details,
					};
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}

				return {
					content: [
						{
							type: "text",
							text: `Error: ${errorMessage}\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}`,
						},
					],
				};
			}
		},
	);

	// Search and extract tool
	server.tool(
		"search_and_extract",
		{
			query: z.string().describe("Search query"),
			page: z.number().optional().describe("Page number"),
			results: z.number().optional().describe("Number of results"),
			social_platforms: z
				.array(socialPlatformSchema)
				.describe("Social media platforms to search"),
			response_mode: responseModeSchema.optional().describe("Response format"),
			include_comments: z
				.boolean()
				.optional()
				.describe("Include comments and replies"),
		},
		async (params) => {
			try {
				const searchRequest: SearchPostRequest = {
					query: params.query,
					page: params.page || 1,
					results: params.results || 10,
					social_platforms: params.social_platforms,
					response_mode: params.response_mode || "raw",
					include_comments: params.include_comments || false,
				};

				const response =
					await getPostCrawlClient().searchAndExtract(searchRequest);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(response, null, 2),
						},
					],
				};
			} catch (error) {
				let errorMessage = "Unknown error occurred";
				let errorDetails = {};

				if (error instanceof ApiError) {
					errorMessage = error.userMessage;
					errorDetails = {
						type: error.type,
						code: error.code,
						request_id: error.requestId,
						details: error.details,
					};
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}

				return {
					content: [
						{
							type: "text",
							text: `Error: ${errorMessage}\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}`,
						},
					],
				};
			}
		},
	);

	// Extract tool
	server.tool(
		"extract",
		{
			urls: z.array(z.string()).describe("URLs to extract content from"),
			response_mode: responseModeSchema.optional().describe("Response format"),
			include_comments: z
				.boolean()
				.optional()
				.describe("Include comments and replies"),
		},
		async (params) => {
			try {
				const extractRequest: ExtractRequest = {
					urls: params.urls,
					response_mode: params.response_mode || "raw",
					include_comments: params.include_comments || false,
				};

				const response = await getPostCrawlClient().extract(extractRequest);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(response, null, 2),
						},
					],
				};
			} catch (error) {
				let errorMessage = "Unknown error occurred";
				let errorDetails = {};

				if (error instanceof ApiError) {
					errorMessage = error.userMessage;
					errorDetails = {
						type: error.type,
						code: error.code,
						request_id: error.requestId,
						details: error.details,
					};
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}

				return {
					content: [
						{
							type: "text",
							text: `Error: ${errorMessage}\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}`,
						},
					],
				};
			}
		},
	);

	// Health check tool
	server.tool("check_health", {}, async () => {
		try {
			const response = await getPostCrawlClient().checkHealth();

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(response, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error: ${
							error instanceof Error ? error.message : "Unknown error"
						}`,
					},
				],
			};
		}
	});

	return server;
}

// Render homepage
app.get("/mcp", async (c) => {
	const content = await homeContent(c.req.raw);
	return c.html(layout(content, "MCP Reference | PostCrawl"));
});

// Manual MCP JSON-RPC endpoint (bypass StreamableHTTPServerTransport)
app.post("/mcp", async (c) => {
	try {
		// Extract authentication
		const authHeader =
			c.req.header("authorization") || c.req.header("Authorization");
		if (!authHeader) {
			const error = Errors.authentication()
				.withRequestId(generateRequestId())
				.missingAuthHeader();
			return c.json(
				{
					jsonrpc: "2.0",
					error: {
						code: -32000,
						message: error.message,
						data: {
							type: error.type,
							code: error.code,
							request_id: error.requestId,
							user_message: error.userMessage,
						},
					},
					id: null,
				},
				error.statusCode as any,
			);
		}

		const token = authHeader.replace("Bearer ", "");
		if (!token) {
			const error = Errors.authentication()
				.withRequestId(generateRequestId())
				.invalidApiKey();
			return c.json(
				{
					jsonrpc: "2.0",
					error: {
						code: -32000,
						message: error.message,
						data: {
							type: error.type,
							code: error.code,
							request_id: error.requestId,
							user_message: error.userMessage,
						},
					},
					id: null,
				},
				error.statusCode as any,
			);
		}

		// Get the request body
		const body = await c.req.json();

		// Create server
		const _server = createServer(token);

		// Handle MCP protocol manually
		if (body.method === "initialize") {
			return c.json({
				jsonrpc: "2.0",
				result: {
					protocolVersion: "2024-11-05",
					capabilities: {
						tools: {},
					},
					serverInfo: {
						name: "PostCrawl",
						version: "1.0.0",
					},
				},
				id: body.id,
			});
		}

		if (body.method === "tools/list") {
			return c.json({
				jsonrpc: "2.0",
				result: {
					tools: [
						{
							name: "search",
							description: "Search for posts across social media platforms",
							inputSchema: {
								type: "object",
								properties: {
									query: { type: "string", description: "Search query" },
									page: { type: "number", default: 1 },
									results: { type: "number", default: 10 },
									social_platforms: {
										type: "array",
										items: { type: "string", enum: socialPlatformValues },
									},
								},
								required: ["query"],
							},
						},
						{
							name: "search_and_extract",
							description: "Search and extract content in a single operation",
							inputSchema: {
								type: "object",
								properties: {
									query: { type: "string", description: "Search query" },
									page: { type: "number", default: 1 },
									results: { type: "number", default: 10 },
									social_platforms: {
										type: "array",
										items: { type: "string", enum: socialPlatformValues },
									},
									response_mode: {
										type: "string",
										enum: responseModeValues,
										default: "raw",
									},
									include_comments: { type: "boolean", default: false },
								},
								required: ["query"],
							},
						},
						{
							name: "extract",
							description: "Extract content from specific URLs",
							inputSchema: {
								type: "object",
								properties: {
									urls: { type: "array", items: { type: "string" } },
									response_mode: {
										type: "string",
										enum: responseModeValues,
										default: "raw",
									},
									include_comments: { type: "boolean", default: false },
								},
								required: ["urls"],
							},
						},
						{
							name: "check_health",
							description: "Check PostCrawl API health",
							inputSchema: {
								type: "object",
								properties: {},
							},
						},
					],
				},
				id: body.id,
			});
		}

		if (body.method === "tools/call") {
			const toolName = body.params.name;
			const args = body.params.arguments || {};

			try {
				let result: unknown;
				const client = new PostCrawlClient({ apiKey: token });

				switch (toolName) {
					case "search":
						result = await client.search(args);
						break;
					case "search_and_extract":
						result = await client.searchAndExtract(args);
						break;
					case "extract":
						result = await client.extract(args);
						break;
					case "check_health":
						result = await client.checkHealth();
						break;
					default:
						throw new Error(`Unknown tool: ${toolName}`);
				}

				return c.json({
					jsonrpc: "2.0",
					result: {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2),
							},
						],
					},
					id: body.id,
				});
			} catch (error) {
				if (error instanceof ApiError) {
					// Map ApiError to appropriate JSON-RPC error code
					let jsonRpcCode = -32000; // Default to server error

					switch (error.type) {
						case "validation_error":
							jsonRpcCode = -32602; // Invalid params
							break;
						case "authentication_error":
						case "rate_limit_error":
						case "insufficient_credits_error":
						case "forbidden_error":
						case "not_found_error":
							jsonRpcCode = -32000;
							break;
						case "internal_error":
							jsonRpcCode = -32603;
							break;
					}

					return c.json({
						jsonrpc: "2.0",
						error: {
							code: jsonRpcCode,
							message: error.message,
							data: {
								type: error.type,
								code: error.code,
								request_id: error.requestId,
								user_message: error.userMessage,
								details: error.details,
								doc_url: `https://docs.postcrawl.com/errors#${error.code}`,
							},
						},
						id: body.id,
					});
				}

				// For non-ApiError exceptions, return a generic error
				return c.json({
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: error instanceof Error ? error.message : "Unknown error",
					},
					id: body.id,
				});
			}
		}

		// Default response for unknown methods
		const error = Errors.notFound()
			.withRequestId(generateRequestId())
			.generic(`Method not found: ${body.method || "unknown"}`);
		return c.json({
			jsonrpc: "2.0",
			error: {
				code: -32601,
				message: error.message,
				data: {
					type: error.type,
					code: error.code,
					request_id: error.requestId,
				},
			},
			id: body.id,
		});
	} catch (error) {
		console.error("Error handling MCP request:", error);
		const apiError = Errors.internal()
			.withRequestId(generateRequestId())
			.internalError("Failed to process MCP request");
		return c.json(
			{
				jsonrpc: "2.0",
				error: {
					code: -32603,
					message: apiError.message,
					data: {
						type: apiError.type,
						code: apiError.code,
						request_id: apiError.requestId,
					},
				},
				id: null,
			},
			apiError.statusCode as any,
		);
	}
});

export default app;
