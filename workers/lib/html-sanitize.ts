const BLOCKED_TAGS =
	/<\/?(?:script|iframe|object|embed|form|base|meta|link|style|svg|math)[^>]*>/gi;
const EVENT_HANDLERS = /\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URLS = /\s(?:href|src|xlink:href)\s*=\s*(?:"|')\s*javascript:[^"']*(?:"|')/gi;

export function sanitizeRichHtml(html: string): string {
	return html
		.replace(BLOCKED_TAGS, "")
		.replace(EVENT_HANDLERS, "")
		.replace(DANGEROUS_URLS, "")
		.trim();
}