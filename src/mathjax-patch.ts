// Multiple Teapst instances (or future code also patching MathJax) might load
// in the same window. We only want one real patch installed; the first
// installer wins and later installers just bump a refcount so unloading one
// instance doesn't rip the patch out from under the others.
export type Tex2Chtml = (expression: string, options?: unknown) => unknown;

export interface MathJaxLike {
	tex2chtml: Tex2Chtml;
}

export interface MathJaxPatchHandle {
	readonly original: Tex2Chtml;
	release(): void;
}

interface PatchRecord {
	original: Tex2Chtml;
	wrapper: Tex2Chtml;
	users: number;
}

const PATCH_KEY = Symbol.for('teapst.mathjax.patch');

function getPatch(mathJax: MathJaxLike): PatchRecord | undefined {
	return (mathJax as unknown as Record<symbol, PatchRecord>)[PATCH_KEY];
}

function setPatch(mathJax: MathJaxLike, patch: PatchRecord | undefined): void {
	if (patch) {
		Object.defineProperty(mathJax, PATCH_KEY, { value: patch, configurable: true });
	} else {
		delete (mathJax as unknown as Record<symbol, unknown>)[PATCH_KEY];
	}
}

export function installMathJaxPatch(mathJax: MathJaxLike, makeWrapper: (original: Tex2Chtml) => Tex2Chtml): MathJaxPatchHandle {
	const existing = getPatch(mathJax);
	const original = existing ? existing.original : mathJax.tex2chtml;

	if (existing) {
		existing.users++;
	} else {
		const wrapper = makeWrapper(original);
		mathJax.tex2chtml = wrapper;
		setPatch(mathJax, { original, wrapper, users: 1 });
	}

	let released = false;
	return {
		original,
		release() {
			if (released) return;
			released = true;
			const patch = getPatch(mathJax);
			if (!patch || patch.original !== original) return;
			patch.users--;
			if (patch.users <= 0 && mathJax.tex2chtml === patch.wrapper) {
				mathJax.tex2chtml = patch.original;
				setPatch(mathJax, undefined);
			}
		},
	};
}
