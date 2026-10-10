import { describe, expect, it } from 'vitest';
import { createConverter, isLatexExpression } from '../src/converter';

describe('isLatexExpression', () => {
	it('treats a backslash control sequence as native LaTeX', () => {
		expect(isLatexExpression('\\frac{1}{2}')).toBe(true);
	});

	it('treats bare Typst syntax as Typst', () => {
		expect(isLatexExpression('frac(1, 2) + alpha^2')).toBe(false);
	});

	it('does not mistake a lone backslash (Typst row separator) for a LaTeX command', () => {
		expect(isLatexExpression('a \\ b')).toBe(false);
	});

	it('treats a bare "\\%" as native LaTeX even with no letter command', () => {
		expect(isLatexExpression('100\\%')).toBe(true);
	});
});

describe('createConverter', () => {
	it('converts basic Typst math to LaTeX', () => {
		const { convert } = createConverter();
		expect(convert('hat(theta)')).toBe('\\hat{\\theta}');
		expect(convert('frac(1, 2) + alpha^2')).toBe('\\frac{1}{2} + \\alpha^2');
	});

	it('wraps cases() in a cases environment', () => {
		const { convert } = createConverter();
		const latex = convert('cases(1 & "if" x > 0, 2 & "if" x <= 0)');
		expect(latex).toContain('\\begin{cases}');
		expect(latex).toContain('\\end{cases}');
		expect(latex).toContain('\\text{if}');
	});

	it('wraps mat() in a matrix environment', () => {
		const { convert } = createConverter();
		const latex = convert('mat(1, 2; 3, 4)');
		expect(latex).toContain('\\begin{pmatrix}');
		expect(latex).toContain('1 & 2');
	});

	it('turns \\ row separators into LaTeX row breaks', () => {
		const { convert } = createConverter();
		expect(convert('a \\ b \\ c')).toBe('a \\\\ b \\\\ c');
	});

	it('auto-wraps aligned rows containing &', () => {
		const { convert } = createConverter();
		const latex = convert('a &= b \\ c &= d');
		expect(latex).toContain('\\begin{aligned}');
		expect(latex).toContain('a &= b \\\\ c &= d');
	});

	it('converts quoted Typst strings to \\text{}', () => {
		const { convert } = createConverter();
		expect(convert('"hello world"')).toBe('\\text{hello world}');
	});

	it('escapes a bare percent sign', () => {
		const { convert } = createConverter();
		expect(convert('100%')).toContain('\\%');
	});

	it('converts canonical arrow symbols', () => {
		const { convert } = createConverter();
		expect(convert('arrow.r')).toBe('\\rightarrow');
		expect(convert('arrow.l.r.double')).toBe('\\Leftrightarrow');
	});

	it('normalizes CRLF line endings and strips zero-width characters before converting', () => {
		const { convert } = createConverter();
		const withCrlf = convert('a\r\n+b');
		const withZeroWidth = convert('a​+b');
		expect(withCrlf).not.toContain('\r');
		expect(withZeroWidth).not.toContain('​');
	});

	it('caches repeated conversions of the same normalized expression', () => {
		const { convert } = createConverter();
		const first = convert('frac(1, 2)');
		const second = convert('frac(1, 2)');
		expect(second).toBe(first);
		// Different transport-level encoding of the same expression should
		// still hit the cache after normalization.
		expect(convert('frac(1,\r\n2)'.replace('\r\n', ' '))).toBeDefined();
	});

	it('propagates a parse error for malformed Typst input', () => {
		const { convert } = createConverter();
		expect(() => convert('cases(')).toThrow();
	});
});
