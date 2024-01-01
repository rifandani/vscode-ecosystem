# Vscode Ecosystem

<a href="https://marketplace.visualstudio.com/items?itemName=rifandani.vscode-ecosystem" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/rifandani.vscode-ecosystem?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>

![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/rifandani.vscode-ecosystem?logo=visual-studio-marketplace)

Collection of useful vscode extensions functionality that I frequently use for frontend development in one extension

## Requirements

1. Node.js v18+

## Features

1. ***Snippets***

Javascript/Typescript and React snippets. Support for Vue and Svelte coming soon.

Check for all the supported snippets [here](./src/snippets/react.json)

2. ***Highlight***

Highlight defined annotations (ex. `NOTE:`, `TODO:`, `FIXME:`) within your code. Supports for custom annotations and decoration styles.

Check the full details in [highlight docs](./src/docs/highlight.md)

3. ***File Nesting***

Making your files tree cleaner in vscode. This is opinionated, but you can change the settings later on.

Check the full details in [file nesting docs](./src/docs/file-nesting.md)

4. ***Colorize***

Highlight web colors in your document. Support for hex, rgb, rgba, hsl, lch, display-p3, and oklab colors. Also supports named colors (e.g grey, green, red, etc...).

Check the full details in [colorize docs](./src/docs/colorize.md)

5. ***Logger***

Easy console logger with support to comment, uncomment, and delete all occurrences. For now only supports Javascript code.

Check the full details in [logger docs](./src/docs/logger.md)

6. ***Region***

Automatic code region markers, and delete markers easily in your editor/workspace.

Check the full details in [region docs](./src/docs/region.md)

7. ***Packager***

View, add, update, and delete your Javascript dependencies easily.

Check the full details in [packager docs](./src/docs/packager.md)

8. ***Deliner***

Do you have a lot of `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `istanbul ignore next`, etc..., but when you try to delete it using vscode built-in search and replace, it only deletes the text, and not the entire line?

This extension will instead deletes the line, instead of the text only. This will make your code cleaner without any unnecessary comments.

Check the full details in [deliner docs](./src/docs/deliner.md)

## Issues and Roadmap

Check the full details in [repo issues](https://github.com/rifandani/vscode-ecosystem/issues)