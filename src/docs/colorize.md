# Intro

![](../../res/colorize.png)

Preview css web colors directly in your document/file. Supports named color, include / exclude custom defined directories, and modifying how the decoration styles applied in the document.

## Commands

This extension contributes the following commands to the Command palette.

- `veco.colorize.toggleEnabled`: Toggle enable/disable the web colors colorizer

## Configurations

To add or change keywords and other settings, <kbd>command</kbd> + <kbd>,</kbd> (or on Windows / Linux: File -> Preferences -> User Settings) to open the VSCode file `settings.json`.

```ts
interface ColorizeDefaultConfig {
  enabled: boolean
  namedColor: boolean
  include: string[]
  exclude: string[]
  decorationType:
    | 'background'
    | 'foreground'
    | 'outline'
    | 'underline'
    | 'dot-before'
    | 'dot-after'
}

const colorizeDefaultConfig = {
  /**
   * Enable or disable the web colors decorations
   */
  enabled: true,
  /**
   * Also colorize named color (e.g red, black, white, grey, green, etc.)
   */
  namedColor: false,
  /**
   * Decoration type to highlight the colors
   */
  decorationType: 'background',
  /**
   * Glob patterns that defines the files to search for. Only include files you need
   */
  include: [
    '**/*.js',
    '**/*.jsx',
    '**/*.ts',
    '**/*.tsx',
    '**/*.vue',
    '**/*.svelte',
    '**/*.astro',
    '**/*.html',
    '**/*.css',
    '**/*.scss',
    '**/*.less',
    '**/*.md',
    '**/*.mdx',
    '**/*.json',
  ],
  /**
   * Glob pattern that defines files and folders to exclude while listing annotations.
   */
  exclude: [
    '**/node_modules/**',
    '**/bower_components/**',
    '**/dev-dist/**',
    '**/dist/**',
    '**/build/**',
    '**/html/**',
    '**/coverage/**',
    '**/out/**',
    '**/.vscode/**',
    '**/.vscode-test/**',
    '**/.github/**',
    '**/_output/**',
    '**/*.min.*',
    '**/*.map',
    '**/.next/**',
  ],
} satisfies ColorizeDefaultConfig
```

## Inspirations

Inspired by [vscode-ext-color-highlight by enyancc](https://github.com/enyancc/vscode-ext-color-highlight) which is not actively maintained.

The differences are:

1. Full refactor to `typescript`
2. Supports more color format using `colorjs.io`
3. Fewer config properties