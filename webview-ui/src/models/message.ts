import type { Suggestion } from '@/modules/suggestion/model'

export interface ExtSuggestionsMessage {
  type: 'ext.suggestions'
  suggestions: Suggestion[]
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

export type IncomingMessage = ExtSuggestionsMessage
export type OutcomingMessage = SearchMessage | LinkMessage | InstallMessage
