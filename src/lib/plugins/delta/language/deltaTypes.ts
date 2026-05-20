export type ProjectionMode = 'flat' | 'grouped'

export type DeltaLanguageEngine = 'codemirror' | 'monaco'

export type DeltaKeyTokenType =
  | 'directive'
  | 'path'
  | 'bracket'
  | 'operator'
  | 'number'
  | 'selector-string'
  | 'dot'
  | 'other'

export interface DeltaKeyToken {
  type: DeltaKeyTokenType
  text: string
  start: number
  end: number
  bracketDepth?: number
}

export interface DeltaSourceMap {
  [key: string]: unknown
}

export interface DeltaLanguageService {
  isDeltaLikeKey: (key: string) => boolean
  tokenizeKey: (key: string) => DeltaKeyToken[]
  findMatchingBracket: (tokens: DeltaKeyToken[], tokenIndex: number) => number
  getBracketDepth: (tokens: DeltaKeyToken[], tokenIndex: number) => number | undefined
}
