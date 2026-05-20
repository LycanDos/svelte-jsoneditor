import type { JSONPath } from 'immutable-json-patch'
import { DELTA_GROUP_NODE, type DeltaProjectionGroup } from './projectionTypes.js'

interface TrieNode {
  children: Map<string, TrieNode>
  terminalValue?: unknown
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function createTrieNode(): TrieNode {
  return {
    children: new Map<string, TrieNode>()
  }
}

function splitDeltaPath(path: string): string[] {
  if (path === '') {
    return ['']
  }

  const segments: string[] = []
  let current = ''
  let bracketDepth = 0
  let quote: '"' | "'" | undefined = undefined
  let escaped = false

  for (const char of path) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (quote) {
      current += char

      if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = undefined
      }

      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      current += char
      continue
    }

    if (char === '[') {
      bracketDepth += 1
      current += char
      continue
    }

    if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1
      current += char
      continue
    }

    if (char === '.' && bracketDepth === 0) {
      segments.push(current)
      current = ''
      continue
    }

    current += char
  }

  segments.push(current)

  return segments
}

function markGroupNode(value: Record<string, unknown>): DeltaProjectionGroup {
  Object.defineProperty(value, DELTA_GROUP_NODE, {
    value: true,
    enumerable: false,
    configurable: true,
    writable: true
  })

  return value as DeltaProjectionGroup
}

function isGroupCandidate(node: TrieNode): boolean {
  return node.terminalValue === undefined && node.children.size > 0
}

function collectLeafEntries(
  node: TrieNode,
  prefix: string[] = []
): Array<{ segments: string[]; value: unknown }> {
  const entries: Array<{ segments: string[]; value: unknown }> = []

  if (node.terminalValue !== undefined) {
    entries.push({
      segments: prefix,
      value: node.terminalValue
    })
  }

  for (const [key, child] of node.children) {
    entries.push(...collectLeafEntries(child, prefix.concat(key)))
  }

  return entries
}

function createProjectedGroup(
  node: TrieNode,
  prefix: string[],
  flatKeyPathMap: Map<string, JSONPath>
): DeltaProjectionGroup {
  const projected: Record<string, unknown> = {}

  for (const [key, child] of node.children) {
    if (isGroupCandidate(child)) {
      projected[key] = createProjectedGroup(child, prefix.concat(key), flatKeyPathMap)
      continue
    }

    for (const entry of collectLeafEntries(child, [key])) {
      const displayKey = entry.segments.join('.')
      const rawKey = prefix.concat(entry.segments).join('.')

      projected[displayKey] = entry.value
      flatKeyPathMap.set(rawKey, prefix.concat(displayKey))
    }
  }

  return markGroupNode(projected)
}

export function isDeltaProjectionGroup(value: unknown): value is DeltaProjectionGroup {
  return isPlainObject(value) && Boolean((value as DeltaProjectionGroup)[DELTA_GROUP_NODE])
}

export interface GroupedDeltaProjection {
  json: unknown
  flatKeyPathMap: Map<string, JSONPath>
}

export function createGroupedDeltaProjection(value: unknown): GroupedDeltaProjection {
  if (!isPlainObject(value)) {
    return {
      json: value,
      flatKeyPathMap: new Map<string, JSONPath>()
    }
  }

  const trie = createTrieNode()

  for (const [rawKey, entryValue] of Object.entries(value)) {
    const segments = splitDeltaPath(rawKey)
    let current = trie

    for (const segment of segments) {
      const child = current.children.get(segment) ?? createTrieNode()
      current.children.set(segment, child)
      current = child
    }

    current.terminalValue = entryValue
  }

  const flatKeyPathMap = new Map<string, JSONPath>()

  return {
    json: createProjectedGroup(trie, [], flatKeyPathMap),
    flatKeyPathMap
  }
}

export function projectFlatDeltaToGrouped(value: unknown): unknown {
  return createGroupedDeltaProjection(value).json
}

export function flattenGroupedDelta(value: unknown): unknown {
  if (!isPlainObject(value)) {
    return value
  }

  const flattened: Record<string, unknown> = {}

  function visit(node: Record<string, unknown>, prefix: string[]) {
    for (const [key, child] of Object.entries(node)) {
      const nextPrefix = prefix.concat(splitDeltaPath(key))

      if (isDeltaProjectionGroup(child)) {
        visit(child, nextPrefix)
      } else {
        flattened[nextPrefix.join('.')] = child
      }
    }
  }

  visit(value, [])

  return flattened
}

export function mapFlatDeltaPathToGroupedPath(
  flatKeyPathMap: Map<string, JSONPath>,
  path: JSONPath
): JSONPath {
  if (path.length === 0) {
    return path
  }

  const [rawKey, ...rest] = path
  const mappedPath = flatKeyPathMap.get(String(rawKey))

  return mappedPath ? mappedPath.concat(rest) : path
}
