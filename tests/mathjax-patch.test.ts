import { describe, expect, it } from 'vitest';
import { installMathJaxPatch, MathJaxLike, Tex2Chtml } from '../src/mathjax-patch';

function fakeMathJax(original: Tex2Chtml): MathJaxLike {
	return { tex2chtml: original };
}

describe('installMathJaxPatch', () => {
	it('replaces tex2chtml with the wrapper and restores it on release', () => {
		const original: Tex2Chtml = (expr) => `orig:${expr}`;
		const mathJax = fakeMathJax(original);

		const handle = installMathJaxPatch(mathJax, (orig) => (expr, opts) => `wrapped:${orig(expr, opts)}`);
		expect(mathJax.tex2chtml('x')).toBe('wrapped:orig:x');
		expect(handle.original).toBe(original);

		handle.release();
		expect(mathJax.tex2chtml).toBe(original);
	});

	it('keeps the first patch installed when a second instance installs, and only restores after both release', () => {
		const original: Tex2Chtml = (expr) => `orig:${expr}`;
		const mathJax = fakeMathJax(original);

		const first = installMathJaxPatch(mathJax, (orig) => (expr, opts) => `A:${orig(expr, opts)}`);
		const patchedAfterFirst = mathJax.tex2chtml;

		// A second installer should NOT install its own wrapper over the first;
		// it should observe the same original and just bump the refcount.
		const second = installMathJaxPatch(mathJax, (orig) => (expr, opts) => `B:${orig(expr, opts)}`);
		expect(mathJax.tex2chtml).toBe(patchedAfterFirst);
		expect(second.original).toBe(original);

		first.release();
		// Still referenced by `second`, so the patch must still be installed.
		expect(mathJax.tex2chtml).toBe(patchedAfterFirst);

		second.release();
		expect(mathJax.tex2chtml).toBe(original);
	});

	it('release() is idempotent', () => {
		const original: Tex2Chtml = (expr) => `orig:${expr}`;
		const mathJax = fakeMathJax(original);

		const handle = installMathJaxPatch(mathJax, (orig) => (expr, opts) => orig(expr, opts));
		handle.release();
		handle.release();
		expect(mathJax.tex2chtml).toBe(original);
	});

	it('does not clobber a patch it does not own if tex2chtml was reassigned externally', () => {
		const original: Tex2Chtml = (expr) => `orig:${expr}`;
		const mathJax = fakeMathJax(original);

		const handle = installMathJaxPatch(mathJax, (orig) => (expr, opts) => orig(expr, opts));
		const somethingElse: Tex2Chtml = (expr) => `other:${expr}`;
		mathJax.tex2chtml = somethingElse;

		handle.release();
		expect(mathJax.tex2chtml).toBe(somethingElse);
	});
});
