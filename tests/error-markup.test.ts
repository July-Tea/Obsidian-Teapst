import { describe, expect, it } from 'vitest';
import { errorMarkup } from '../src/error-markup';

describe('errorMarkup', () => {
	it('wraps an Error message in a red span', () => {
		const html = errorMarkup(new Error('boom'));
		expect(html).toBe('<span style="color: red;">Error: boom</span>');
	});

	it('stringifies non-Error values', () => {
		expect(errorMarkup('plain string')).toBe('<span style="color: red;">plain string</span>');
	});

	it('escapes HTML-significant characters so error text cannot inject markup', () => {
		const html = errorMarkup(new Error('<script>alert("x")</script> & \'quote\''));
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
		expect(html).toContain('&amp;');
		expect(html).toContain('&quot;');
		expect(html).toContain('&#39;');
	});
});
