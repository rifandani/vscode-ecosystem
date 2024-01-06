export interface Registry {
  objects: Suggestion[]
  total: number
  time: string
}

export interface Suggestion {
  flags: {
    insecure: number
  }
  package: Package
  score: Score
  searchScore: number
}

export interface Score {
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

export interface Links {
  npm: string
  homepage: string
  repository: string
  bugs: string
}

export interface Author {
  name: string
  email: string
  username: string
}

export interface Publisher {
  username: string
  email: string
}

export interface Maintainer {
  username: string
  email: string
}
