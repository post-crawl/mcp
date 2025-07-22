import { html } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";

export const layout = (
	content: HtmlEscapedString | string,
	title: string,
) => html`
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>${title}</title>
			<script src="https://cdn.tailwindcss.com"></script>
			<script>
				tailwind.config = {
					theme: {
						extend: {
							colors: {
								primary: "#3498db",
								secondary: "#2ecc71",
								accent: "#f39c12",
							},
							fontFamily: {
								sans: ["Inter", "system-ui", "sans-serif"],
								heading: ["Roboto", "system-ui", "sans-serif"],
							},
						},
					},
				};
			</script>
			<style>
				@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap");

				.markdown h1 {
					font-size: 2.25rem;
					font-weight: 700;
					font-family: "Roboto", system-ui, sans-serif;
					color: #1a202c;
					margin-bottom: 1rem;
					line-height: 1.2;
				}

				.markdown h2 {
					font-size: 1.5rem;
					font-weight: 600;
					font-family: "Roboto", system-ui, sans-serif;
					color: #2d3748;
					margin-top: 1.5rem;
					margin-bottom: 0.75rem;
					line-height: 1.3;
				}

				.markdown p {
					font-size: 1.125rem;
					color: #4a5568;
					margin-bottom: 1rem;
					line-height: 1.6;
				}

				.markdown code {
					font-family: monospace;
					font-size: 0.875rem;
					background-color: #f7fafc;
					padding: 0.125rem 0.25rem;
					border-radius: 0.25rem;
				}
			</style>
		</head>
		<body class="bg-gray-50 text-gray-800 font-sans leading-relaxed flex flex-col min-h-screen">
			<header class="bg-white shadow-sm mb-8">
				<div class="container mx-auto px-4 py-4 flex justify-between items-center">
					<a
						href="/"
						class="text-xl font-heading font-bold text-primary hover:text-primary/80 transition-colors"
					>
						PostCrawl MCP Server
					</a>
				</div>
			</header>
			<main class="container mx-auto px-4 pb-12 flex-grow">
				${content}
			</main>
			<footer class="bg-gray-100 py-6 mt-12">
				<div class="container mx-auto px-4 text-center text-gray-600">
					<p>&copy; ${new Date().getFullYear()} PostCrawl MCP Server. All rights reserved.</p>
				</div>
			</footer>
		</body>
	</html>
`;

export const homeContent = async (
	_req: Request,
): Promise<HtmlEscapedString> => {
	return html`
		<div class="max-w-6xl mx-auto">
			<h1 class="text-4xl font-heading font-bold mb-6 text-gray-900">
				PostCrawl MCP Server
			</h1>
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
				<p class="text-yellow-800 text-sm">
					<strong>Note:</strong> All parameters use snake_case naming convention (e.g., social_platforms, include_comments)
				</p>
			</div>
			
			<div class="space-y-8">
				<!-- Search Tool -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-2xl font-semibold mb-4 text-gray-800">
						<code class="text-blue-600">search</code> Tool
					</h2>
					<p class="text-gray-600 mb-4">
						Search for posts across social media platforms (Reddit and TikTok).
					</p>
					
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<h3 class="font-semibold text-lg mb-2">Request Format</h3>
							<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"><code>{
  "query": "artificial intelligence",
  "page": 1,
  "results": 10,
  "social_platforms": ["reddit", "tiktok"]
}</code></pre>
							<div class="mt-3 text-sm text-gray-600">
								<p><strong>Parameters:</strong></p>
								<ul class="list-disc ml-5 mt-1 space-y-1">
									<li><code>query</code> (required): Search query string</li>
									<li><code>page</code>: Page number (default: 1)</li>
									<li><code>results</code>: Number of results (default: 10, max: 100)</li>
									<li><code>social_platforms</code>: Array of platforms</li>
								</ul>
							</div>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-2">Response Format</h3>
							<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"><code>[{
  "title": "AI Discussion Thread",
  "url": "https://reddit.com/r/...",
  "snippet": "Discussing the latest...",
  "date": "Dec 28, 2024",
  "imageUrl": "https://..."
}]</code></pre>
							<p class="mt-3 text-sm text-gray-600">
								Returns an array of search results with formatted date strings.
							</p>
						</div>
					</div>
				</div>

				<!-- Extract Tool -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-2xl font-semibold mb-4 text-gray-800">
						<code class="text-blue-600">extract</code> Tool
					</h2>
					<p class="text-gray-600 mb-4">
						Extract content from specific Reddit or TikTok URLs.
					</p>
					
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<h3 class="font-semibold text-lg mb-2">Request Format</h3>
							<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"><code>{
  "urls": [
    "https://reddit.com/r/...",
    "https://tiktok.com/@..."
  ],
  "include_comments": true,
  "response_mode": "markdown"
}</code></pre>
							<div class="mt-3 text-sm text-gray-600">
								<p><strong>Parameters:</strong></p>
								<ul class="list-disc ml-5 mt-1 space-y-1">
									<li><code>urls</code> (required): Array of URLs to extract</li>
									<li><code>include_comments</code>: Include comments (default: false)</li>
									<li><code>response_mode</code>: "raw" or "markdown" (default: "raw")</li>
								</ul>
							</div>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-2">Response Format</h3>
							<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"><code>[{
  "url": "https://reddit.com/r/...",
  "source": "reddit",
  "raw": {
    "id": "abc123",
    "title": "Post Title",
    "description": "Post content...",
    "upvotes": 1234,
    "comments": [...]
  },
  "markdown": "# Post Title\n\n...",
  "error": null
}]</code></pre>
							<p class="mt-3 text-sm text-gray-600">
								Returns extracted posts with platform-specific data.
							</p>
						</div>
					</div>
				</div>

				<!-- Search and Extract Tool -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-2xl font-semibold mb-4 text-gray-800">
						<code class="text-blue-600">search_and_extract</code> Tool
					</h2>
					<p class="text-gray-600 mb-4">
						Combined search and extract operation - searches for posts and automatically extracts their content.
					</p>
					
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<h3 class="font-semibold text-lg mb-2">Request Format</h3>
							<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"><code>{
  "query": "machine learning",
  "page": 1,
  "results": 5,
  "social_platforms": ["reddit"],
  "include_comments": true,
  "response_mode": "markdown"
}</code></pre>
							<div class="mt-3 text-sm text-gray-600">
								<p><strong>Parameters:</strong></p>
								<ul class="list-disc ml-5 mt-1 space-y-1">
									<li><code>query</code> (required): Search query</li>
									<li><code>page</code>: Page number</li>
									<li><code>results</code>: Number of results to extract</li>
									<li><code>social_platforms</code>: Platforms to search</li>
									<li><code>include_comments</code>: Extract comments</li>
									<li><code>response_mode</code>: Output format</li>
								</ul>
							</div>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-2">Response Format</h3>
							<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"><code>[{
  "url": "https://reddit.com/r/...",
  "source": "reddit",
  "raw": { /* full post data */ },
  "markdown": "# Post Title\n\n...",
  "error": null
}]</code></pre>
							<p class="mt-3 text-sm text-gray-600">
								Returns extracted posts from search results.
							</p>
						</div>
					</div>
				</div>

				<!-- Health Check Tool -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-2xl font-semibold mb-4 text-gray-800">
						<code class="text-blue-600">check_health</code> Tool
					</h2>
					<p class="text-gray-600 mb-4">
						Check the health status of the PostCrawl API.
					</p>
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<h3 class="font-semibold text-lg mb-2">Request Format</h3>
							<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"><code>{}
// No parameters required</code></pre>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-2">Response Format</h3>
							<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"><code>{
  "status": "OK"
}</code></pre>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
				<h2 class="text-xl font-semibold mb-3 text-blue-900">
					Authentication Required
				</h2>
				<p class="text-blue-800">
					All tools require a valid PostCrawl API key passed as a Bearer token 
					in the Authorization header:
				</p>
				<pre class="mt-3 bg-blue-100 p-3 rounded text-sm"><code>Authorization: Bearer sk_your_api_key_here</code></pre>
			</div>

			<div class="bg-gray-50 rounded-lg p-6 mt-8">
				<h2 class="text-xl font-semibold mb-3 text-gray-800">
					Supported Platforms
				</h2>
				<div class="grid md:grid-cols-2 gap-4">
					<div class="flex items-center space-x-2">
						<span class="text-2xl">🟠</span>
						<div>
							<strong>Reddit</strong>
							<p class="text-sm text-gray-600">Extract posts, comments, and discussions</p>
						</div>
					</div>
					<div class="flex items-center space-x-2">
						<span class="text-2xl">⚫</span>
						<div>
							<strong>TikTok</strong>
							<p class="text-sm text-gray-600">Extract videos, comments, and metadata</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
};
