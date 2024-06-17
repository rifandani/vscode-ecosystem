# Intro

![](../../res/packager.gif)

This module will make it easy to list, add, update, delete, and view outdated node dependencies within your vscode. In your activity bar, there will be new "packager" view. There are 2 main sections, "Install Dependencies" & "Node Dependencies" section.

In "Install Dependencies" section, you can search and list any node dependencies (using npm API). You can see the latest version, description, latest updated at, and tags from the list. Finally you can also install the dependency by clicking "Install" to install it as prod dependency, or click the dropdown and click "devDependencies" to install it as dev dependency.

In "Node Dependencies" section, you can see your installed node dependencies (recursively). You can see your current installed dependency version (e.g `axios ^1.0.0`), updateable dependency (e.g `ky ^1.0.0 -> ^1.2.0`), type of dependency (e.g `vite (dev) ^5.0.0`). To see your dependency dependencies, click on the tree item to expand it dependencies recursively. To delete your dependency, click on the trash icon. To update single dependency, click on the up arrow (only applicable for updateable dependency). To see the dependency npm docs, click on the link icon. To refresh the list manually, click on the refresh icon on the right side of the "Node Dependencies" section. To update all installed dependencies, click on the double up arrow icon on the right side of the "Node Dependencies" section.

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
  moduleTypes: ('dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies')[]
  versionTarget:
    | 'semver'
    | 'latest'
  exclude: string[]
}

export const packagerDefaultConfig = {
  /**
   * Check one or more types of dependencies only
   *
   * - "dependencies": refers to "dependencies" in package.json
   * - "devDependencies": refers to "devDependencies" in package.json
   * - "optionalDependencies": refers to "optionalDependencies" in package.json
   * - "peerDependencies": refers to "peerDependencies" in package.json
   */
  moduleTypes: ['dependencies', 'devDependencies'],
  /**
   * Determines the version to upgrade to
   *
   * - "semver": Upgrade to the highest version within the semver range specified in your package.json
   * - "latest": Upgrade to whatever the package's "latest" git tag points to. Excludes prereleases.
   */
  versionTarget: 'semver',
  /**
   * Glob pattern that defines the dependency that you want to exclude
   *
   * @example
   *
   * ["@types/*", "@storybook/*"]
   */
  exclude: [],
} satisfies PackagerDefaultConfig
```
