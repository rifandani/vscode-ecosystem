# Intro

![](https://user-images.githubusercontent.com/11247099/157142238-b00deecb-8d56-424f-9b20-ef6a6f5ddf99.png)

Forked from [File Nesting Config by antfu](https://github.com/antfu/vscode-file-nesting-config). All credits goes to original authors.

The differences are:

1. there is no manual/auto update
2. the config settings is applied lazily by executiong the `Apply File Nesting Config` command
3. you can choose to apply it in the global/workspace settings
4. you can easily remove the settings by executing `Remove File Nesting Config` command

## Commands

This extension contributes the following commands to the Command palette.

- `Apply File Nesting Config`: apply the file nesting config in either global/workspace settings
- `Remove File Nesting Config`: remove the file nesting config in both global & workspace settings