import vscode from 'vscode'

// #region INTERFACES
export type CustomDiagnosticSeverity = 'error' | 'warning' | 'information' | 'hint' | 'none'

export interface KeywordObject extends Partial<vscode.DecorationRenderOptions> {
  text: string
  regex?: { pattern: string | RegExp }
  /**
   * @default 'none'
   */
  diagnosticSeverity?: CustomDiagnosticSeverity
}
export type Keyword = string | KeywordObject

export interface HighlightDefaultConfig {
  enabled: boolean
  toggleURI: boolean
  isCaseSensitive: boolean
  enableDiagnostics: boolean
  maxFilesForSearch: number
  defaultStyle: Partial<vscode.DecorationRenderOptions>
  keywords: Array<Keyword>
  keywordsPattern: string | RegExp
  include: Array<string>
  exclude: Array<string>
}

export interface FileNestingDefaultConfig {
  enabled: boolean
  expand: boolean
  patterns: Record<string, string>
}

export interface ColorizeDefaultConfig {
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

export interface PackagerDefaultConfig {
  moduleTypes: ('dependencies' | 'devDependencies' | 'optionalDependencies' | 'peerDependencies')[]
  versionTarget: 'semver' | 'latest'
}

export interface DelinerDefaultConfig {
  include: string
  exclude: string
}
// #endregion

// #region CONSTANTS
export const constants = {
  severityMapper: {
    error: vscode.DiagnosticSeverity.Error,
    warning: vscode.DiagnosticSeverity.Warning,
    information: vscode.DiagnosticSeverity.Information,
    hint: vscode.DiagnosticSeverity.Hint,
    none: undefined,
  },
} as const

export const configs = {
  highlight: {
    root: 'veco.highlight',
    enabled: 'enabled',
    toggleURI: 'toggleURI',
    isCaseSensitive: 'isCaseSensitive',
    enableDiagnostics: 'enableDiagnostics',
    maxFilesForSearch: 'maxFilesForSearch',
    defaultStyle: 'defaultStyle',
    keywords: 'keywords',
    keywordsPattern: 'keywordsPattern',
    include: 'include',
    exclude: 'exclude',
  },
  fileNesting: {
    root: 'explorer.fileNesting',
    enabled: 'enabled',
    expand: 'expand',
    patterns: 'patterns',
  },
  colorize: {
    root: 'veco.colorize',
    enabled: 'enabled',
    namedColor: 'namedColor',
    include: 'include',
    exclude: 'exclude',
    decorationType: 'decorationType',
  },
  packager: {
    root: 'veco.packager',
    moduleTypes: 'moduleTypes',
    versionTarget: 'versionTarget',
  },
  deliner: {
    root: 'veco.deliner',
    include: 'include',
    exclude: 'exclude',
  },
} as const

export const viewsContainer = {
  activitybar: {
    packager: 'veco_packager',
  },
} as const

export const views = {
  veco_packager: 'veco_packager.treeDataProvider',
} as const

export const highlightDefaultConfig = {
  /**
   * Enable or disable the highlighting
   */
  enabled: true,
  /**
   * If the file path within the output channel is not clickable,
   * set this to true to toggle the path patten between `<path>#<line>` and `<path>:<line>:<column>`
   */
  toggleURI: false,
  /**
   * Specify whether the keywords are case sensitive or not
   */
  isCaseSensitive: true,
  /**
   * Enable creating diagnostic entries for open files in the problems view.
   */
  enableDiagnostics: false,
  /**
   * Max files for searching, mostly you don't need to configure this
   */
  maxFilesForSearch: 5120,
  /**
   * An array of keywords that will be highlighted.
   * You can also specify the style for each keyword here,
   * and a more advanced regex to detect the item to highlight.
   */
  keywords: [
    {
      text: 'NOTE:',
      diagnosticSeverity: 'information',
      color: '#fff',
      backgroundColor: 'rgba(27,154,170,1)',
      overviewRulerColor: 'rgba(27,154,170,0.8)',
    },
    {
      text: 'TODO:',
      diagnosticSeverity: 'warning',
      color: '#fff',
      backgroundColor: 'rgba(255,197,61,1)',
      overviewRulerColor: 'rgba(255,197,61,0.8)',
    },
    {
      text: 'FIXME:',
      diagnosticSeverity: 'error',
      color: '#fff',
      backgroundColor: 'rgba(239,71,110,1)',
      overviewRulerColor: 'rgba(239,71,110,0.8)',
    },
  ],
  /**
   * Specify keywords via regex instead of `veco.highlight.keywords` one by one.
   *
   * NOTE: if this is present, `veco.highlight.keywords` will be ignored.
   * Remember to escape the backslash if there's any in your regex
   * (using \\ (double backslash) instead of single backslash).
   */
  keywordsPattern: '',
  /**
   * Specify the default style for custom keywords, if not specified, build in default style will be applied
   *
   * @link [DecorationRenderOptions](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions)
   */
  defaultStyle: {
    color: '#2196f3',
    backgroundColor: '#ffeb3b',
  },
  /**
   * Glob patterns that defines the files to search for.
   *
   * NOTE: explicitly specifying include patterns will override the default settings,
   * so if you want to add new patterns, and also use the defaults,
   * you will need to include the default patterns as well.
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
    '**/*.php',
    '**/*.css',
    '**/*.scss',
    '**/*.less',
    '**/*.md',
    '**/*.mdx',
    '**/*.json',
  ],
  /**
   * Glob pattern that defines files and folders to exclude while listing annotations.
   *
   * NOTE: explicitly specifying exclude patterns will override the default settings,
   * so if you want to add new patterns, and also use the defaults,
   * you will need to include the default patterns as well.
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
} satisfies HighlightDefaultConfig

export const fileNestingDefaultConfig = {
  /**
   * Enable or disable the file nesting
   */
  enabled: true,
  /**
   * Expand or collapse the nested files
   */
  expand: false,
  /**
   * List of grouped patterns based on the file extensions
   */
  patterns: {
    '*.asax': '$(capture).*.cs, $(capture).*.vb',
    '*.ascx': '$(capture).*.cs, $(capture).*.vb',
    '*.ashx': '$(capture).*.cs, $(capture).*.vb',
    '*.aspx': '$(capture).*.cs, $(capture).*.vb',
    '*.bloc.dart': '$(capture).event.dart, $(capture).state.dart',
    '*.c': '$(capture).h',
    '*.cc': '$(capture).hpp, $(capture).h, $(capture).hxx',
    '*.cjs': '$(capture).cjs.map, $(capture).*.cjs, $(capture)_*.cjs',
    '*.component.ts': '$(capture).component.html, $(capture).component.spec.ts, $(capture).component.css, $(capture).component.scss, $(capture).component.sass, $(capture).component.less',
    '*.cpp': '$(capture).hpp, $(capture).h, $(capture).hxx',
    '*.cs': '$(capture).*.cs',
    '*.cshtml': '$(capture).cshtml.cs',
    '*.csproj': '*.config, *proj.user, appsettings.*, bundleconfig.json',
    '*.css': '$(capture).css.map, $(capture).*.css',
    '*.cxx': '$(capture).hpp, $(capture).h, $(capture).hxx',
    '*.dart': '$(capture).freezed.dart, $(capture).g.dart',
    '*.ex': '$(capture).html.eex, $(capture).html.heex, $(capture).html.leex',
    '*.fs': '$(capture).fs.js, $(capture).fs.jsx, $(capture).fs.ts, $(capture).fs.tsx, $(capture).fs.rs, $(capture).fs.php, $(capture).fs.dart',
    '*.go': '$(capture)_test.go',
    '*.java': '$(capture).class',
    '*.js': '$(capture).js.map, $(capture).*.js, $(capture)_*.js',
    '*.jsx': '$(capture).js, $(capture).*.jsx, $(capture)_*.js, $(capture)_*.jsx, $(capture).less, $(capture).module.less',
    '*.master': '$(capture).*.cs, $(capture).*.vb',
    '*.mjs': '$(capture).mjs.map, $(capture).*.mjs, $(capture)_*.mjs',
    '*.module.ts': '$(capture).resolver.ts, $(capture).controller.ts, $(capture).service.ts',
    '*.mts': '$(capture).mts.map, $(capture).*.mts, $(capture)_*.mts',
    '*.pubxml': '$(capture).pubxml.user',
    '*.resx': '$(capture).*.resx, $(capture).designer.cs, $(capture).designer.vb',
    '*.tex': '$(capture).acn, $(capture).acr, $(capture).alg, $(capture).aux, $(capture).bbl, $(capture).blg, $(capture).fdb_latexmk, $(capture).fls, $(capture).glg, $(capture).glo, $(capture).gls, $(capture).idx, $(capture).ind, $(capture).ist, $(capture).lof, $(capture).log, $(capture).lot, $(capture).out, $(capture).pdf, $(capture).synctex.gz, $(capture).toc, $(capture).xdv',
    '*.ts': '$(capture).js, $(capture).d.ts.map, $(capture).*.ts, $(capture)_*.js, $(capture)_*.ts',
    '*.tsx': '$(capture).ts, $(capture).*.tsx, $(capture)_*.ts, $(capture)_*.tsx, $(capture).less, $(capture).module.less, $(capture).scss, $(capture).module.scss',
    '*.vbproj': '*.config, *proj.user, appsettings.*, bundleconfig.json',
    '*.vue': '$(capture).*.ts, $(capture).*.js, $(capture).story.vue',
    '*.xaml': '$(capture).xaml.cs',
    '+layout.svelte': '+layout.ts,+layout.ts,+layout.js,+layout.server.ts,+layout.server.js,+layout.gql',
    '+page.svelte': '+page.server.ts,+page.server.js,+page.ts,+page.js,+page.gql',
    '.clang-tidy': '.clang-format, .clangd, compile_commands.json',
    '.env': '*.env, .env.*, .envrc, env.d.ts',
    '.gitignore': '.gitattributes, .gitmodules, .gitmessage, .mailmap, .git-blame*',
    '.project': '.classpath',
    'BUILD.bazel': '*.bzl, *.bazel, *.bazelrc, bazel.rc, .bazelignore, .bazelproject, WORKSPACE',
    'CMakeLists.txt': '*.cmake, *.cmake.in, .cmake-format.yaml, CMakePresets.json, CMakeCache.txt',
    'Cargo.toml': '.clippy.toml, .rustfmt.toml, cargo.lock, clippy.toml, cross.toml, rust-toolchain.toml, rustfmt.toml',
    'Dockerfile': '*.dockerfile, .devcontainer.*, .dockerignore, docker-compose.*, dockerfile*',
    'I*.cs': '$(capture).cs',
    'Pipfile': '.editorconfig, .flake8, .isort.cfg, .python-version, Pipfile, Pipfile.lock, requirements*.in, requirements*.pip, requirements*.txt, tox.ini',
    'README*': 'AUTHORS, Authors, BACKERS*, Backers*, CHANGELOG*, CITATION*, CODEOWNERS, CODE_OF_CONDUCT*, CONTRIBUTING*, CONTRIBUTORS, COPYING*, CREDITS, Changelog*, Citation*, Code_Of_Conduct*, Codeowners, Contributing*, Contributors, Copying*, Credits, GOVERNANCE.MD, Governance.md, HISTORY.MD, History.md, LICENSE*, License*, MAINTAINERS, Maintainers, README*, Readme*, SECURITY.MD, SPONSORS*, Security.md, Sponsors*, authors, backers*, changelog*, citation*, code_of_conduct*, codeowners, contributing*, contributors, copying*, credits, governance.md, history.md, license*, maintainers, readme*, security.md, sponsors*',
    'Readme*': 'AUTHORS, Authors, BACKERS*, Backers*, CHANGELOG*, CITATION*, CODEOWNERS, CODE_OF_CONDUCT*, CONTRIBUTING*, CONTRIBUTORS, COPYING*, CREDITS, Changelog*, Citation*, Code_Of_Conduct*, Codeowners, Contributing*, Contributors, Copying*, Credits, GOVERNANCE.MD, Governance.md, HISTORY.MD, History.md, LICENSE*, License*, MAINTAINERS, Maintainers, README*, Readme*, SECURITY.MD, SPONSORS*, Security.md, Sponsors*, authors, backers*, changelog*, citation*, code_of_conduct*, codeowners, contributing*, contributors, copying*, credits, governance.md, history.md, license*, maintainers, readme*, security.md, sponsors*',
    'artisan': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, playwright.config.*, postcss.config.*, puppeteer.config.*, rspack.config.*, server.php, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, webpack.mix.js, windi.config.*',
    'astro.config.*': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, playwright.config.*, postcss.config.*, puppeteer.config.*, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
    'composer.json': '.php*.cache, composer.lock, phpunit.xml*, psalm*.xml',
    'default.nix': 'shell.nix',
    'deno.json*': '*.env, .env.*, .envrc, api-extractor.json, deno.lock, env.d.ts, import-map.json, import_map.json, jsconfig.*, tsconfig.*, tsdoc.*',
    'flake.nix': 'flake.lock',
    'gatsby-config.*': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, gatsby-browser.*, gatsby-node.*, gatsby-ssr.*, gatsby-transformer.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, playwright.config.*, postcss.config.*, puppeteer.config.*, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
    'gemfile': '.ruby-version, gemfile.lock',
    'go.mod': '.air*, go.sum',
    'go.work': 'go.work.sum',
    'hatch.toml': '.editorconfig, .flake8, .isort.cfg, .python-version, hatch.toml, requirements*.in, requirements*.pip, requirements*.txt, tox.ini',
    'mix.exs': '.credo.exs, .dialyzer_ignore.exs, .formatter.exs, .iex.exs, .tool-versions, mix.lock',
    'next.config.*': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, next-env.d.ts, next-i18next.config.*, playwright.config.*, postcss.config.*, puppeteer.config.*, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
    'nuxt.config.*': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .nuxtignore, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, playwright.config.*, postcss.config.*, puppeteer.config.*, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
    'package.json': '.browserslist*, .circleci*, .commitlint*, .cz-config.js, .czrc, .dlint.json, .dprint.json*, .editorconfig, .eslint*, .firebase*, .flowconfig, .github*, .gitlab*, .gitpod*, .huskyrc*, .jslint*, .lintstagedrc*, .markdownlint*, .node-version, .nodemon*, .npm*, .nvmrc, .pm2*, .pnp.*, .pnpm*, .prettier*, .release-please*.json, .releaserc*, .sentry*, .simple-git-hooks*, .stackblitz*, .styleci*, .stylelint*, .tazerc*, .textlint*, .tool-versions, .travis*, .versionrc*, .vscode*, .watchman*, .xo-config*, .yamllint*, .yarnrc*, Procfile, apollo.config.*, appveyor*, azure-pipelines*, biome.json, bower.json, build.config.*, bun.lockb, commitlint*, crowdin*, dangerfile*, dlint.json, dprint.json*, electron-builder.*, eslint*, firebase.json, grunt*, gulp*, jenkins*, lerna*, lint-staged*, nest-cli.*, netlify*, nodemon*, npm-shrinkwrap.json, nx.*, package-lock.json, package.nls*.json, phpcs.xml, pm2.*, pnpm*, prettier*, pullapprove*, pyrightconfig.json, release-please*.json, release-tasks.sh, release.config.*, renovate*, rollup.config.*, rspack*, simple-git-hooks*, stylelint*, tslint*, tsup.config.*, turbo*, typedoc*, unlighthouse*, vercel*, vetur.config.*, webpack*, workspace.json, xo.config.*, yarn*',
    'pubspec.yaml': '.metadata, .packages, all_lint_rules.yaml, analysis_options.yaml, build.yaml, pubspec.lock, pubspec_overrides.yaml',
    'pyproject.toml': '.editorconfig, .flake8, .isort.cfg, .pdm-python, .pdm.toml, .python-version, MANIFEST.in, Pipfile, Pipfile.lock, hatch.toml, pdm.lock, poetry.lock, pyproject.toml, requirements*.in, requirements*.pip, requirements*.txt, setup.cfg, setup.py, tox.ini',
    'quasar.conf.js': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, playwright.config.*, postcss.config.*, puppeteer.config.*, quasar.extensions.json, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
    'readme*': 'AUTHORS, Authors, BACKERS*, Backers*, CHANGELOG*, CITATION*, CODEOWNERS, CODE_OF_CONDUCT*, CONTRIBUTING*, CONTRIBUTORS, COPYING*, CREDITS, Changelog*, Citation*, Code_Of_Conduct*, Codeowners, Contributing*, Contributors, Copying*, Credits, GOVERNANCE.MD, Governance.md, HISTORY.MD, History.md, LICENSE*, License*, MAINTAINERS, Maintainers, README*, Readme*, SECURITY.MD, SPONSORS*, Security.md, Sponsors*, authors, backers*, changelog*, citation*, code_of_conduct*, codeowners, contributing*, contributors, copying*, credits, governance.md, history.md, license*, maintainers, readme*, security.md, sponsors*',
    'remix.config.*': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, playwright.config.*, postcss.config.*, puppeteer.config.*, remix.*, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
    'requirements.txt': '.editorconfig, .flake8, .isort.cfg, .python-version, requirements*.in, requirements*.pip, requirements*.txt, tox.ini',
    'rush.json': '.browserslist*, .circleci*, .commitlint*, .cz-config.js, .czrc, .dlint.json, .dprint.json*, .editorconfig, .eslint*, .firebase*, .flowconfig, .github*, .gitlab*, .gitpod*, .huskyrc*, .jslint*, .lintstagedrc*, .markdownlint*, .node-version, .nodemon*, .npm*, .nvmrc, .pm2*, .pnp.*, .pnpm*, .prettier*, .release-please*.json, .releaserc*, .sentry*, .simple-git-hooks*, .stackblitz*, .styleci*, .stylelint*, .tazerc*, .textlint*, .tool-versions, .travis*, .versionrc*, .vscode*, .watchman*, .xo-config*, .yamllint*, .yarnrc*, Procfile, apollo.config.*, appveyor*, azure-pipelines*, biome.json, bower.json, build.config.*, bun.lockb, commitlint*, crowdin*, dangerfile*, dlint.json, dprint.json*, electron-builder.*, eslint*, firebase.json, grunt*, gulp*, jenkins*, lerna*, lint-staged*, nest-cli.*, netlify*, nodemon*, npm-shrinkwrap.json, nx.*, package-lock.json, package.nls*.json, phpcs.xml, pm2.*, pnpm*, prettier*, pullapprove*, pyrightconfig.json, release-please*.json, release-tasks.sh, release.config.*, renovate*, rollup.config.*, rspack*, simple-git-hooks*, stylelint*, tslint*, tsup.config.*, turbo*, typedoc*, unlighthouse*, vercel*, vetur.config.*, webpack*, workspace.json, xo.config.*, yarn*',
    'setup.cfg': '.editorconfig, .flake8, .isort.cfg, .python-version, MANIFEST.in, requirements*.in, requirements*.pip, requirements*.txt, setup.cfg, tox.ini',
    'setup.py': '.editorconfig, .flake8, .isort.cfg, .python-version, MANIFEST.in, requirements*.in, requirements*.pip, requirements*.txt, setup.cfg, setup.py, tox.ini',
    'shims.d.ts': '*.d.ts',
    'svelte.config.*': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, houdini.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, mdsvex.config.js, playwright.config.*, postcss.config.*, puppeteer.config.*, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vite.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
    'vite.config.*': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, playwright.config.*, postcss.config.*, puppeteer.config.*, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
    'vue.config.*': '*.env, .babelrc*, .codecov, .cssnanorc*, .env.*, .envrc, .htmlnanorc*, .lighthouserc.*, .mocha*, .postcssrc*, .terserrc*, api-extractor.json, ava.config.*, babel.config.*, contentlayer.config.*, cssnano.config.*, cypress.*, env.d.ts, formkit.config.*, formulate.config.*, histoire.config.*, htmlnanorc.*, i18n.config.*, jasmine.*, jest.config.*, jsconfig.*, karma*, lighthouserc.*, playwright.config.*, postcss.config.*, puppeteer.config.*, rspack.config.*, svgo.config.*, tailwind.config.*, tsconfig.*, tsdoc.*, uno.config.*, unocss.config.*, vitest.config.*, vuetify.config.*, webpack.config.*, windi.config.*',
  },
} satisfies FileNestingDefaultConfig

export const colorizeDefaultConfig = {
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
} satisfies PackagerDefaultConfig

export const delinerDefaultConfig = {
  /**
   * Glob patterns that defines the files to search for.
   */
  include: '**/*.*',
  /**
   * Glob pattern that defines files and folders to exclude.
   */
  exclude: '**/{node_modules,bower_components,dev-dist,dist,build,html,coverage,out,.vscode,.vscode-test,.github,_output,.next}/**',
} satisfies DelinerDefaultConfig
// #endregion
