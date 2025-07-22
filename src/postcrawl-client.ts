/**
 * PostCrawl API Client for Cloudflare Workers
 *
 * A lightweight client for interacting with the PostCrawl API
 * optimized for Cloudflare Workers runtime.
 */

import {
	type ApiErrorResponse,
	Errors,
	generateRequestId,
} from "@post-crawl/api-errors";
import {
	DEFAULT_BASE_URL,
	type ExtractRequest,
	type Post,
	type PostCrawlClientConfig,
	PostCrawlEndpoints,
	type SearchPostRequest,
	type SearchRequest,
	type SearchResponse,
} from "./types";

export class PostCrawlClient {
	private apiKey: string;
	private baseUrl: string;
	private timeout: number;

	constructor(config: PostCrawlClientConfig) {
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
		this.timeout = config.timeout || 300000;
	}

	private buildUrl(endpoint: string): string {
		return `${this.baseUrl}${endpoint}`;
	}

	private getHeaders(): HeadersInit {
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${this.apiKey}`,
		};
	}

	private async makeRequest<T>(
		endpoint: string,
		method: "GET" | "POST" = "POST",
		body?: unknown,
	): Promise<T> {
		const url = this.buildUrl(endpoint);
		const requestId = generateRequestId();
		const init: RequestInit = {
			method,
			headers: this.getHeaders(),
		};

		if (body && method === "POST") {
			init.body = JSON.stringify(body);
		}

		const response = await fetch(url, init);

		if (!response.ok) {
			// Try to parse error response
			let errorData: any;
			try {
				errorData = await response.json();
			} catch {
				// If JSON parsing fails, throw a generic error
				throw Errors.internal()
					.withRequestId(requestId)
					.internalError(
						`API request failed: ${response.status} ${response.statusText}`,
					);
			}

			// Check if it's an API error response
			if (errorData?.type === "error" && errorData?.error) {
				const apiError = errorData as ApiErrorResponse;
				const err = apiError.error;

				// Map error types to appropriate builders
				switch (err.type) {
					case "authentication_error":
						throw Errors.authentication()
							.withRequestId(err.request_id || requestId)
							.invalidApiKey();

					case "rate_limit_error":
						if (err.details && typeof err.details === "object") {
							const details = err.details as any;
							throw Errors.rateLimit()
								.withRequestId(err.request_id || requestId)
								.exceeded({
									limit: details.limit || 0,
									remaining: details.remaining || 0,
									reset_at: details.reset_at || Date.now() + 60000,
									retry_after: details.retry_after || 60,
								});
						}
						throw Errors.rateLimit()
							.withRequestId(err.request_id || requestId)
							.exceeded({
								limit: 0,
								remaining: 0,
								reset_at: Date.now() + 60000,
								retry_after: 60,
							});

					case "validation_error": {
						const validationError = Errors.validation().withRequestId(
							err.request_id || requestId,
						);

						if (err.details && typeof err.details === "object") {
							const details = err.details as any;
							if (details.field_errors && Array.isArray(details.field_errors)) {
								for (const fieldError of details.field_errors) {
									if (
										fieldError.field &&
										fieldError.code === "missing_required"
									) {
										validationError.addMissingField(fieldError.field);
									} else if (
										fieldError.field &&
										fieldError.code === "invalid_format"
									) {
										validationError.addInvalidFormat(
											fieldError.field,
											fieldError.expected || "valid format",
										);
									}
								}
							}
						}
						throw validationError.build();
					}

					case "insufficient_credits_error":
						if (err.details && typeof err.details === "object") {
							const details = err.details as any;
							throw Errors.credits()
								.withRequestId(err.request_id || requestId)
								.insufficientCredits({
									balance: details.balance || details.available || 0,
									required: details.required || 0,
									deficit:
										details.deficit ||
										details.required -
											(details.balance || details.available || 0) ||
										0,
								});
						}
						throw Errors.credits()
							.withRequestId(err.request_id || requestId)
							.insufficientCredits({
								balance: 0,
								required: 0,
								deficit: 0,
							});

					case "forbidden_error":
						throw Errors.forbidden()
							.withRequestId(err.request_id || requestId)
							.permissionDenied();

					case "not_found_error":
						throw Errors.notFound()
							.withRequestId(err.request_id || requestId)
							.generic(err.message || "Resource not found");

					default:
						// For unknown error types, create a generic internal error
						throw Errors.internal()
							.withRequestId(err.request_id || requestId)
							.internalError(err.message || "An unexpected error occurred");
				}
			}

			// If it's not a standard API error response, throw a generic error
			throw Errors.internal()
				.withRequestId(requestId)
				.internalError(
					`API request failed: ${response.status} ${response.statusText}`,
				);
		}

		return response.json() as T;
	}

	async search(request: SearchRequest): Promise<SearchResponse> {
		// Validate social_platforms
		if (request.social_platforms && request.social_platforms.length === 0) {
			throw Errors.validation()
				.withRequestId(generateRequestId())
				.addFieldError(
					"social_platforms",
					"invalid_value",
					"At least one platform must be specified",
				)
				.build();
		}

		const searchRequest = {
			query: request.query,
			page: request.page || 1,
			results: request.results || 10,
			social_platforms: request.social_platforms,
		};

		const response = await this.makeRequest<SearchResponse>(
			PostCrawlEndpoints.SEARCH,
			"POST",
			searchRequest,
		);
		return response;
	}

	async searchAndExtract(request: SearchPostRequest): Promise<Post[]> {
		// Validate social_platforms
		if (request.social_platforms && request.social_platforms.length === 0) {
			throw Errors.validation()
				.withRequestId(generateRequestId())
				.addFieldError(
					"social_platforms",
					"invalid_value",
					"At least one platform must be specified",
				)
				.build();
		}

		const searchRequest = {
			query: request.query,
			page: request.page || 1,
			results: request.results || 10,
			social_platforms: request.social_platforms,
			response_mode: request.response_mode || "raw",
			include_comments: request.include_comments ?? false,
		};

		const response = await this.makeRequest<Post[]>(
			PostCrawlEndpoints.SEARCH_EXTRACT,
			"POST",
			searchRequest,
		);
		return response;
	}

	async extract(request: ExtractRequest): Promise<Post[]> {
		const extractRequest = {
			urls: request.urls,
			response_mode: request.response_mode || "raw",
			include_comments: request.include_comments ?? false,
		};

		const response = await this.makeRequest<Post[]>(
			PostCrawlEndpoints.EXTRACT,
			"POST",
			extractRequest,
		);
		return response;
	}

	async checkHealth(): Promise<{ status: string } | unknown> {
		const url = this.buildUrl(PostCrawlEndpoints.HEALTH);
		const response = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(),
		});

		if (!response.ok) {
			throw new Error(
				`PostCrawl API error: ${response.status} ${response.statusText}`,
			);
		}

		const text = await response.text();
		try {
			return JSON.parse(text);
		} catch {
			return { status: text };
		}
	}
}
