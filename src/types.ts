/**
 * Type definitions for the PostCrawl API.
 *
 * This module contains all types used for request and response objects
 * in the PostCrawl MCP server.
 */

import type {
	ExtractedPost,
	ResponseMode,
	SearchAndExtractRequest,
	SearchResult,
	ExtractRequest as SharedExtractRequest,
	SocialPlatform,
} from "@post-crawl/extraction-schemas";

// Re-export types from shared schemas
export type Post = ExtractedPost;

// Search response is just an array of SearchResult items
export type SearchResponse = SearchResult[];

export interface SearchRequest {
	query: string;
	page?: number;
	results?: number;
	social_platforms?: SocialPlatform[];
}

// Use shared extract request type
export type ExtractRequest = SharedExtractRequest;

// Use shared search and extract request type
export type SearchPostRequest = SearchAndExtractRequest;

export interface PostCrawlClientConfig {
	apiKey: string;
	baseUrl?: string;
	timeout?: number;
}

export const PostCrawlEndpoints = {
	SEARCH: "/v1/search",
	SEARCH_EXTRACT: "/v1/search-and-extract",
	EXTRACT: "/v1/extract",
	HEALTH: "/health",
} as const;

export const DEFAULT_BASE_URL: string =
	process.env.POSTCRAWL_API_URL || "https://edge.postcrawl.com";

// Re-export types for convenience
export type { SocialPlatform, ResponseMode };
