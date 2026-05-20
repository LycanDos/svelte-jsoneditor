import { deepStrictEqual } from 'assert'
import { describe, test } from 'vitest'
import { resolveDeltaSources } from './resolveDeltaSources.js'

describe('resolveDeltaSources', () => {
  test('should infer target when there is exactly one source', () => {
    const resolved = resolveDeltaSources(
      {
        main: { id: 1 }
      },
      undefined
    )

    deepStrictEqual(resolved.sourceIds, ['main'])
    deepStrictEqual(resolved.target, 'main')
    deepStrictEqual(resolved.base, { id: 1 })
    deepStrictEqual(resolved.requiresExplicitTarget, false)
  })

  test('should require explicit target when there are multiple sources', () => {
    const resolved = resolveDeltaSources(
      {
        main: { id: 1 },
        user: { id: 2 }
      },
      undefined
    )

    deepStrictEqual(resolved.sourceIds, ['main', 'user'])
    deepStrictEqual(resolved.target, undefined)
    deepStrictEqual(resolved.base, undefined)
    deepStrictEqual(resolved.requiresExplicitTarget, true)
  })

  test('should drop an unknown target and keep sources intact', () => {
    const resolved = resolveDeltaSources(
      {
        main: { id: 1 },
        user: { id: 2 }
      },
      'tenant'
    )

    deepStrictEqual(resolved.target, undefined)
    deepStrictEqual(resolved.base, undefined)
    deepStrictEqual(resolved.requiresExplicitTarget, true)
  })
})
