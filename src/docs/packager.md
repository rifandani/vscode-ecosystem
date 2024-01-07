# Intro

This module will make it easy to list, add, update, delete, and view outdated node dependencies within your vscode.

## Commands

This extension contributes the following commands to the Command palette.

- `veco.packager.refreshEntry`: Refresh the node dependencies that displayed in the "Packager: Node Dependencies" view.
- `veco.packager.link`: Open/link the module dependency to external NPM website.
- `veco.packager.remove`: Uninstall/remove the selected module dependency.
- `veco.packager.updateAll`: Update all outdated module dependencies.
- `veco.packager.updateSingle`: Update single outdated module dependency.

## Configurations

To add or change keywords and other settings, <kbd>command</kbd> + <kbd>,</kbd> (or on Windows / Linux: File -> Preferences -> User Settings) to open the VSCode file `settings.json`.

```ts
export interface PackagerDefaultConfig {
  moduleTypes: ('prod' | 'dev' | 'optional' | 'peer')[]
  versionTarget:
    | 'latest'
    | 'newest'
    | 'greatest'
    | 'minor'
    | 'patch'
}

export const packagerDefaultConfig = {
  /**
   * Check one or more types of dependencies only
   *
   * - "prod": refers to "dependencies" in package.json
   * - "dev": refers to "devDependencies" in package.json
   * - "optional": refers to "optionalDependencies" in package.json
   * - "peer": refers to "peerDependencies" in package.json
   */
  moduleTypes: ['prod', 'dev'],
  /**
   * Determines the version to upgrade to
   *
   * - "latest": Upgrade to whatever the package's "latest" git tag points to. Excludes prereleases.
   * - "newest": Upgrade to the version with the most recent publish date, even if there are other version numbers that are higher. Includes prereleases.
   * - "greatest": Upgrade to the highest version number published, regardless of release date or tag.
   * - "minor": Upgrade to the highest minor version without bumping the major version.
   * - "patch": Upgrade to the highest patch version without bumping the minor or major versions.
   */
  versionTarget: 'latest',
} satisfies PackagerDefaultConfig
```

## Inspirations

Based on the vscode [Tree View API](https://code.visualstudio.com/api/extension-guides/tree-view) tutorial.
