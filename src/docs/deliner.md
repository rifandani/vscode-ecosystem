# Intro

Do you have a lot of `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `istanbul ignore next`, etc..., but when you try to delete it using vscode built-in search and replace, it only deletes the text, and not the entire line?

This extension will instead deletes the line, instead of the text only. This will make your code cleaner without any unnecessary comments.

To Delete all input text occurrences across the workspace:

![Gif here]()

## Commands

This extension contributes the following commands to the Command palette.

- `veco.deliner.deleteAll`: Delete lines based on the input text across the workspace