import { typst2tex } from 'tex2typst';
import { BoundedCache } from './cache';

const LATEX_COMMAND = /\\[A-Za-z]/;

// A math body containing a LaTeX control sequence (e.g. `\frac`) is assumed
// to be native LaTeX rather than Typst, so it's passed through untouched.
// tex2typst's Typst parser throws on real LaTeX input anyway, so this check
// also protects against spurious conversion errors.
export function isLatexExpression(expression: string): boolean {
	return LATEX_COMMAND.test(expression);
}

const INVISIBLE_CHARS = /[\u200B\u200C\u200D\uFEFF]/g;

// Obsidian's Live Preview and Reading View can hand MathJax equivalent
// expressions with different line endings or zero-width layout characters.
// Normalize only those transport-level differences; real Typst syntax is
// left untouched for tex2typst to parse.
function normalizeRendererInput(expression: string): string {
	return expression.replace(/\r\n?/g, '\n').replace(INVISIBLE_CHARS, '').trim();
}

export interface Converter {
	convert(expression: string): string;
}

export function createConverter(maxCacheEntries = 512): Converter {
	const cache = new BoundedCache<string, string>(maxCacheEntries);

	return {
		convert(expression: string): string {
			const normalized = normalizeRendererInput(expression);
			const cached = cache.get(normalized);
			if (cached !== undefined) return cached;

			const latex = typst2tex(normalized);
			cache.set(normalized, latex);
			return latex;
		},
	};
}
