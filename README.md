# Vscode Ecosystem

<div style="display: flex; gap: 1rem;">

[![CI](https://github.com/rifandani/vscode-ecosystem/actions/workflows/ci.yml/badge.svg)](https://github.com/rifandani/vscode-ecosystem/actions/workflows/ci.yml)

[![Release](https://github.com/rifandani/vscode-ecosystem/actions/workflows/release.yml/badge.svg)](https://github.com/rifandani/vscode-ecosystem/actions/workflows/release.yml)

</div>

<div style="display: flex; gap: 1rem;">

![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/rifandani.vscode-ecosystem?logo=visual-studio-marketplace)

<a href="https://marketplace.visualstudio.com/items?itemName=rifandani.vscode-ecosystem" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/rifandani.vscode-ecosystem?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>

</div>

Collection of useful vscode extensions to increase productivity that I frequently use for frontend development packed in one extension

## Requirements

You need to have / install these tools before using the extensions, because the extensions is using it under the hood.

1. Node.js v18+

## Features

1. ***Snippets***

Javascript/Typescript and React snippets. Support for Vue and Svelte coming soon.

Check for all the supported snippets [here](./src/snippets/react.json)

2. ***Highlight***

When developing an application, we often want to emphasize some code to other developers or maybe to our future self. It could be a code that need to be fixed/refactor later (tech debt), notes to others/yourself in the future. This extension could emphasize/highlight your defined annotations (e.g. `NOTE:`, `TODO:`, `FIXME:`) within your code. It supports for custom annotations and decoration styles.

Check the full details in [highlight docs](./src/docs/highlight.md)

3. ***File Nesting***

Big application often has a lot of config files. These files is pretty messy, it's everywhere. This extension could make your files tree cleaner in vscode. This is opinionated, but you can change the settings later on.

Check the full details in [file nesting docs](./src/docs/file-nesting.md)

4. ***Colorize***

When developing a frontend app, we often came into colors. When defining the colors using something like hex, it's pretty hard for us to remember the actual colors. This extension could help to visualize/highlight web colors in your editor. It supports hex, rgb, rgba, hsl, lch, display-p3, oklab, and also named colors (e.g `grey`, `green`, `red`, etc...).

Check the full details in [colorize docs](./src/docs/colorize.md)

5. ***Logger***

When developing application, we often came into bugs. When debugging, sometimes we just like the plain `console.log` instead of debugger breakpoints. This extension could easily output `console.log` your part of codes with support to comment, uncomment, and delete all of its occurrences. Note: for now only supports Javascript code.

Check the full details in [logger docs](./src/docs/logger.md)

6. ***Region***

Marking your code by region/section manually is pretty annoying, especially when the LOC is pretty long. This extension could mark your code, and delete markers easily in your editor/workspace.

Check the full details in [region docs](./src/docs/region.md)

7. ***Packager***

Maintenance of your node dependencies could never be easier. This extension could search, view, install, update, link to npm docs, and delete your node dependencies.

Check the full details in [packager docs](./src/docs/packager.md)

8. ***Deliner***

Do you have a lot of `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `istanbul ignore next`, etc..., but when you try to delete it using vscode built-in search and replace, it only deletes the text, and not the entire line?

This extension will instead deletes the line, instead of the text only. This will make your code cleaner without any unnecessary comments.

Check the full details in [deliner docs](./src/docs/deliner.md)

## Issues and Roadmap

Curious for the current bugs, and future features? Check the full details in [repo issues](https://github.com/rifandani/vscode-ecosystem/issues)
