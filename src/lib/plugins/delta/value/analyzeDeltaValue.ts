import type { JSONPath } from 'immutable-json-patch'
import { getIn } from 'immutable-json-patch'
import type { DeltaValueAnalysis, DeltaValueContext, DeltaValueMatch } from './deltaValueTypes.js'

const RESERVED_ALIAS_NAMES = new Set(['$true', '$false', '$null'])

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

export function extractDeltaExpressionAliases(expression: unknown): string[] {
  if (typeof expression !== 'string') {
    return []
  }

  const matches = expression.match(/\$[A-Za-z_]\w*/g) ?? []
  return uniqueStrings(matches.filter((alias) => !RESERVED_ALIAS_NAMES.has(alias)))
}

export function analyzeDeltaValueMatch(
  match: DeltaValueMatch | undefined,
  context: DeltaValueContext
): DeltaValueAnalysis | undefined {
  if (!match) {
    return undefined
  }

  const aliases = extractDeltaExpressionAliases(match.expression)
  const unknownAliases = aliases.filter((alias) => !context.aliasNames.includes(alias))
  const issues: string[] = []

  if (context.requiresExplicitTarget && aliases.includes('$base')) {
    issues.push('Expression references $base but target is not selected')
  }

  if (unknownAliases.length > 0) {
    issues.push(`Unknown aliases: ${unknownAliases.join(', ')}`)
  }

  return {
    aliases,
    unknownAliases,
    issues
  }
}

export function formatDeltaValueAnalysisTitle(
  analysis: DeltaValueAnalysis | undefined,
  fallback: string
): string {
  if (!analysis || analysis.issues.length === 0) {
    return fallback
  }

  return `${fallback}; ${analysis.issues.join('; ')}`
}

export function resolveDeltaValueExpressionPath(
  json: unknown,
  path: JSONPath,
  match: DeltaValueMatch | undefined
): JSONPath {
  if (!match) {
    return path
  }

  const value = getIn(json, path)

  if (value !== undefined) {
    return path.concat(match.language.directive)
  }

  return path
}
