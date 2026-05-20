import { deepStrictEqual } from 'assert'
import { describe, test } from 'vitest'
import {
  createGroupedDeltaProjection,
  flattenGroupedDelta,
  mapFlatDeltaPathToGroupedPath
} from './grouped-projection.js'

describe('grouped-projection', () => {
  test('should group flat delta keys and flatten them back losslessly', () => {
    const flatDelta = {
      'user.profile.displayName': { $jina: "firstName & ' ' & lastName" },
      'user.profile.avatar': 'data:image/svg+xml;utf8,xxx',
      'user.settings.theme': 'dark'
    }

    const projection = createGroupedDeltaProjection(flatDelta)

    deepStrictEqual(projection.json, {
      user: {
        profile: {
          displayName: { $jina: "firstName & ' ' & lastName" },
          avatar: 'data:image/svg+xml;utf8,xxx'
        },
        settings: {
          theme: 'dark'
        }
      }
    })

    deepStrictEqual(flattenGroupedDelta(projection.json), flatDelta)
    deepStrictEqual(
      mapFlatDeltaPathToGroupedPath(projection.flatKeyPathMap, ['user.profile.displayName']),
      ['user', 'profile', 'displayName']
    )
    deepStrictEqual(
      mapFlatDeltaPathToGroupedPath(projection.flatKeyPathMap, ['user.profile.displayName', '$jina']),
      ['user', 'profile', 'displayName', '$jina']
    )
  })

  test('should preserve conflicting keys by falling back to dotted display keys', () => {
    const flatDelta = {
      'user.profile': 1,
      'user.profile.avatar': 2,
      'user.profile.name': 3
    }

    const projection = createGroupedDeltaProjection(flatDelta)

    deepStrictEqual(projection.json, {
      user: {
        profile: 1,
        'profile.avatar': 2,
        'profile.name': 3
      }
    })

    deepStrictEqual(flattenGroupedDelta(projection.json), flatDelta)
    deepStrictEqual(mapFlatDeltaPathToGroupedPath(projection.flatKeyPathMap, ['user.profile']), [
      'user',
      'profile'
    ])
    deepStrictEqual(
      mapFlatDeltaPathToGroupedPath(projection.flatKeyPathMap, ['user.profile.avatar']),
      ['user', 'profile.avatar']
    )
  })
})
