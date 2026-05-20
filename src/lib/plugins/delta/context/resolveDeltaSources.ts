import type { DeltaSourceMap } from '../language/deltaTypes.js'

export interface ResolvedDeltaSources {
  sourceIds: string[]
  sources: DeltaSourceMap
  target: string | undefined
  base: unknown
  requiresExplicitTarget: boolean
}

export function resolveDeltaSources(
  deltaSources: DeltaSourceMap | undefined,
  deltaTarget: string | undefined
): ResolvedDeltaSources {
  const sources = deltaSources ?? {}
  const sourceIds = Object.keys(sources)

  let target = deltaTarget

  if (target && !(target in sources)) {
    target = undefined
  }

  if (!target && sourceIds.length === 1) {
    target = sourceIds[0]
  }

  const requiresExplicitTarget = sourceIds.length > 1 && !target

  return {
    sourceIds,
    sources,
    target,
    base: target ? sources[target] : undefined,
    requiresExplicitTarget
  }
}
