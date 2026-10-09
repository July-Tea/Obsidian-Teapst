# Teapst

在 Obsidian 中直接用 **Typst 语法** 书写数学公式。
Write math in Obsidian using **Typst syntax**.

```markdown
行内公式：$hat(theta) = frac(1, n) sum_(i=1)^n x_i$

$$
f(x) = cases(
  1 & "if" x > 0,
  0 & "otherwise"
)
$$
```

## 特性 / Features

- **Typst 数学语法**：行内 `$...$` 与块级 `$$...$$` 公式都可以用 Typst 书写。
  **Typst math syntax** for both inline `$...$` and display `$$...$$` formulas.
- **兼容 LaTeX**：包含 `\命令`（如 `\frac`）的公式会被识别为原生 LaTeX，原样交给 MathJax，旧笔记无需修改。
  **LaTeX-compatible**: any formula containing a `\command` (e.g. `\frac`) is treated as native LaTeX and passed to MathJax untouched, so existing notes keep working.
- **不改动笔记**：转换只在渲染时于内存中进行，笔记中保存的始终是你写的原始内容。
  **Non-destructive**: conversion happens in memory at render time; your notes always keep exactly what you wrote.
- **阅读视图与实时预览** 均可使用，桌面端与移动端均支持。
  Works in both **Reading View and Live Preview**, on desktop and mobile.
- **轻量快速**：纯 JavaScript 实现，无 WASM；转换结果带缓存，插件加载不阻塞 Obsidian 启动。
  **Lightweight**: pure JavaScript, no WASM; conversions are cached and loading never blocks Obsidian's startup.
- **错误可见**：无法解析的公式会以红色错误信息显示，而不是静默失败。
  **Visible errors**: formulas that fail to parse show a red error message instead of failing silently.

## 工作原理 / How it works

Teapst 拦截 Obsidian 内置 MathJax 的 `tex2chtml` 调用：

Teapst intercepts calls to the `tex2chtml` function of Obsidian's built-in MathJax:

1. 公式包含 LaTeX 命令 → 直接交给 MathJax。
   Formula contains a LaTeX command → passed straight to MathJax.
2. 否则视为 Typst → 由 [tex2typst](https://github.com/qwinsi/tex2typst) 转换为 LaTeX → 交给 MathJax 渲染。
   Otherwise it is treated as Typst → converted to LaTeX by [tex2typst](https://github.com/qwinsi/tex2typst) → rendered by MathJax.

因此渲染效果与 Obsidian 原生公式一致，但支持的 Typst 语法范围取决于 tex2typst。
Output therefore looks exactly like Obsidian's native math, while the supported Typst subset is determined by tex2typst.

## 语法提示 / Syntax notes

**文本要加引号。** 与 Typst 一致，裸写的多个字母会被当作独立的数学符号；自然语言文本（包括中文）需要用双引号包起来：

**Quote your text.** As in Typst, bare letters are treated as separate math symbols; wrap natural-language text (including CJK) in double quotes:

```markdown
$"如果模型不描述某个具体过程，它解释的是什么？"$
$x > 0 "for all" x in RR$
```

**换行与对齐。** 用 `\` 换行，用 `&` 对齐，会自动生成 `aligned` 环境：

**Line breaks and alignment.** Use `\` for line breaks and `&` for alignment; an `aligned` environment is created automatically:

```markdown
$$
a &= b + c \
  &= d
$$
```

**矩阵与分段函数。** 使用 `mat(...)`、`vec(...)`、`cases(...)`：

**Matrices and piecewise functions.** Use `mat(...)`, `vec(...)`, `cases(...)`:

```markdown
$mat(1, 2; 3, 4)$
```

**混用 LaTeX。** 一个公式里只要出现 `\命令`，整条公式都会按 LaTeX 处理，因此不要在同一条公式里混用两种语法。

**Mixing with LaTeX.** If a formula contains any `\command`, the whole formula is handled as LaTeX — don't mix the two syntaxes within a single formula.

## 安装 / Installation

### 手动安装 / Manual

1. 构建插件（见下文）或从 Release 下载 `main.js` 与 `manifest.json`。
   Build the plugin (see below) or download `main.js` and `manifest.json` from a release.
2. 将它们放入 `<你的仓库>/.obsidian/plugins/teapst/`。
   Copy them into `<your vault>/.obsidian/plugins/teapst/`.
3. 在 Obsidian 设置 → 第三方插件 中启用 **Teapst**。
   Enable **Teapst** in Obsidian Settings → Community plugins.

## 开发 / Development

```bash
npm install
npm run dev     # 监听并构建 / watch & build
npm run build   # 类型检查 + 生产构建 / type-check + production build
npm test        # 运行单元测试 / run unit tests (vitest)
```

### 项目结构 / Project structure

```
main.ts                 插件入口：安装 MathJax 补丁、刷新视图 / plugin entry: installs the MathJax patch, refreshes views
src/converter.ts        Typst → LaTeX 转换、LaTeX 检测、缓存 / Typst → LaTeX conversion, LaTeX detection, caching
src/mathjax-patch.ts    引用计数式的 MathJax 补丁与还原 / ref-counted MathJax patching and restore
src/cache.ts            有界缓存 / bounded cache
src/error-markup.ts     将转换错误安全地渲染为 HTML / safe HTML rendering of conversion errors
tests/                  vitest 单元测试 / vitest unit tests
```

## 致谢 / Acknowledgements

Typst → LaTeX 的转换由 [tex2typst](https://github.com/qwinsi/tex2typst) 完成。
Typst → LaTeX conversion is powered by [tex2typst](https://github.com/qwinsi/tex2typst).

## 作者 / Author

JulyTea（juratjan123@outlook.com）

## 许可证 / License

[MIT](LICENSE)
