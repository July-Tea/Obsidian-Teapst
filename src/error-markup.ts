export function errorMarkup(error: unknown): string {
	const message = error instanceof Error ? error.toString() : String(error);
	const escaped = message.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
	return `<span style="color: red;">${escaped}</span>`;
}
