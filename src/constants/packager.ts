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
