import type { PackagerDefaultConfig } from './config'

// #region INTERFACES
export type DepType = PackagerDefaultConfig['moduleTypes'][number]
export type UpdateableDepType =
  'updatableDependencies' |
  'updatableDevDependencies' |
  'updatableOptionalDependencies' |
  'updatablePeerDependencies'
export type NestedDepType =
  'nestedDependencies' |
  'nestedDevDependencies' |
  'nestedOptionalDependencies' |
  'nestedPeerDependencies'
export type ContextValue =
  DepType |
  UpdateableDepType |
  NestedDepType

export interface JsdelivrResolvedDep {
  type: string
  name: string
  version: string
  links: {
    self: string
    entrypoints: string
    stats: string
  }
}

export interface Registry {
  objects: Suggestion[]
  total: number
  time: string
}

interface Suggestion {
  flags: {
    insecure: number
  }
  package: Package
  score: Score
  searchScore: number
}

interface Score {
  detail: {
    maintenance: number
    popularity: number
    quality: number
  }
  final: number
}

interface Package {
  name: string
  scope: string
  version: string
  description: string
  keywords: string[]
  date: string
  links: Links
  author?: Author
  publisher: Publisher
  maintainers: Maintainer[]
}

interface Links {
  npm: string
  homepage: string
  repository: string
  bugs: string
}

interface Author {
  name: string
  email: string
  username: string
}

interface Publisher {
  username: string
  email: string
}

interface Maintainer {
  username: string
  email: string
}

export interface SearchMessage {
  type: 'search'
  search: string
}
export interface LinkMessage {
  type: 'link'
  link: string
}
export interface InstallMessage {
  type: 'install-prod' | 'install-dev'
  packageName: string
  version: string
}
export interface ExtSuggestionsMessage {
  type: 'ext.suggestions'
  suggestions: Suggestion[]
}
export type IncomingMessage = SearchMessage | LinkMessage | InstallMessage
export type OutcomingMessage = ExtSuggestionsMessage
// #endregion

export const updateableContextValues: UpdateableDepType[] = ['updatableDependencies', 'updatableDevDependencies', 'updatableOptionalDependencies', 'updatablePeerDependencies']

export const commandIds = {
  refreshEntry: 'veco.packager.refreshEntry',
  link: 'veco.packager.link',
  remove: 'veco.packager.remove',
  updateAll: 'veco.packager.updateAll',
  updateSingle: 'veco.packager.updateSingle',
  init: 'veco.packager.init',
} as const
