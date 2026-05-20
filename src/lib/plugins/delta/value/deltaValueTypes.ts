import type { DeltaSourceMap } from '../language/deltaTypes.js'

export interface DeltaValueLanguageDefinition {
  id: string
  directive: string
  label: string
}

export interface DeltaValueMatch {
  language: DeltaValueLanguageDefinition
  expression: unknown
}

export interface DeltaValueAnalysis {
  aliases: string[]
  unknownAliases: string[]
  issues: string[]
}

export interface DeltaValueRegistry {
  languages: DeltaValueLanguageDefinition[]
  detect: (value: unknown) => DeltaValueMatch | undefined
}

export interface DeltaValueContext {
  target: string | undefined
  base: unknown
  sources: DeltaSourceMap
  requiresExplicitTarget: boolean
  aliases: Record<string, unknown>
  aliasNames: string[]
}
