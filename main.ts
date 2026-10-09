import { MarkdownView, Plugin, loadMathJax } from 'obsidian';
import { installMathJaxPatch, Tex2Chtml } from './src/mathjax-patch';
import { createConverter, isLatexExpression } from './src/converter';
import { errorMarkup } from './src/error-markup';

export default class Teapst extends Plugin {
	private release?: () => void;
	private unloaded = false;

	async onload() {
		this.installWorkspaceRefresh();
		// Don't block Obsidian's reported load time on MathJax's own (often
		// lazy) initialization. Until the patch lands, math renders through
		// MathJax's default (unconverted) path; installConverter() re-renders
		// the active view once the patch is in, so the delay is invisible
		// past a brief flash on cold start.
		void this.installConverter();
	}

	private async installConverter() {
		await loadMathJax();
		if (this.unloaded) return;
		if (!globalThis.MathJax) throw new Error('MathJax failed to load.');

		const converter = createConverter();
		const parser = new DOMParser();

		const handle = installMathJaxPatch(globalThis.MathJax, (original: Tex2Chtml): Tex2Chtml => (expression, options) => {
			if (isLatexExpression(expression)) {
				// In LaTeX, % starts a comment that MathJax deletes to end of
				// line. tex2typst already escapes % correctly on the Typst
				// path (below), but passthrough LaTeX needs the same
				// protection here so a stray literal % isn't swallowed.
				return original(expression.replace(/(?<!\\)%/g, '\\%'), options);
			}
			try {
				return original(converter.convert(expression), options);
			} catch (error) {
				return parser.parseFromString(errorMarkup(error), 'text/html').body.firstChild;
			}
		});
		this.release = () => handle.release();

		this.rerenderActiveView();
	}

	private installWorkspaceRefresh() {
		// Preserve the initial refresh without blocking plugin startup on a full
		// Markdown render while Obsidian is still laying out the workspace.
		this.app.workspace.onLayoutReady(() => {
			window.requestAnimationFrame(() => this.rerenderActiveView());
		});
	}

	private rerenderActiveView() {
		this.app.workspace.getActiveViewOfType(MarkdownView)?.previewMode.rerender(true);
	}

	onunload() {
		this.unloaded = true;
		this.release?.();
		this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
			const view = leaf.view as MarkdownView;
			view?.previewMode.rerender(true);
		});
	}
}
