import { resolveDeltaSources } from '../context/resolveDeltaSources.js'
import type { DeltaSourceMap } from '../language/deltaTypes.js'
import type { DeltaValueContext } from './deltaValueTypes.js'

function isAliasName(sourceId: string): boolean {
  return /^[A-Za-z_]\w*$/.test(sourceId)
}

export function resolveDeltaValueContext(
  deltaSources: DeltaSourceMap | undefined,
  deltaTarget: string | undefined
): DeltaValueContext {
  const resolvedSources = resolveDeltaSources(deltaSources, deltaTarget)
  const aliases: Record<string, unknown> = {
    sources: resolvedSources.sources
  }
  const aliasNames = ['$sources']

  if (resolvedSources.target) {
    aliases.base = resolvedSources.base
    aliasNames.push('$base')
  }

  for (const sourceId of resolvedSources.sourceIds) {
    if (isAliasName(sourceId)) {
      aliases[sourceId] = resolvedSources.sources[sourceId]
      aliasNames.push(`$${sourceId}`)
    }
  }

  return {
    target: resolvedSources.target,
    base: resolvedSources.base,
    sources: resolvedSources.sources,
    requiresExplicitTarget: resolvedSources.requiresExplicitTarget,
    aliases,
    aliasNames
  }
}

export function formatDeltaValueContextTitle(context: DeltaValueContext): string {
  const targetText = context.target ? `target=${context.target}` : 'target=unset'
  return `${targetText}; aliases: ${context.aliasNames.join(', ')}`
}

