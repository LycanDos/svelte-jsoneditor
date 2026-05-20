import { deepStrictEqual } from 'assert'
import { describe, test } from 'vitest'
import {
  analyzeDeltaValueMatch,
  extractDeltaExpressionAliases,
  formatDeltaValueAnalysisTitle,
  resolveDeltaValueExpressionPath
} from './analyzeDeltaValue.js'
import { collectDeltaValueValidationErrors } from './collectDeltaValueValidationErrors.js'
import { createDefaultDeltaValueRegistry } from './createDefaultDeltaValueRegistry.js'
import { formatDeltaValueContextTitle, resolveDeltaValueContext } from './resolveDeltaValueContext.js'

describe('deltaValueRegistry', () => {
  test('should detect default delta value wrapper objects', () => {
    const registry = createDefaultDeltaValueRegistry()

    deepStrictEqual(registry.detect({ $jina: 'a + b' }), {
      language: {
        id: 'jina',
        directive: '$jina',
        label: 'Jina'
      },
      expression: 'a + b'
    })
    deepStrictEqual(registry.detect({ value: 'x' }), undefined)
    deepStrictEqual(registry.detect({ $jina: 'x', extra: true }), undefined)
  })

  test('should resolve value context aliases from sources and target', () => {
    const context = resolveDeltaValueContext(
      {
        main: { id: 1 },
        user: { id: 2 },
        'bad-id': { id: 3 }
      },
      'main'
    )

    deepStrictEqual(context.target, 'main')
    deepStrictEqual(context.aliasNames, ['$sources', '$base', '$main', '$user'])
    deepStrictEqual(formatDeltaValueContextTitle(context), 'target=main; aliases: $sources, $base, $main, $user')
  })

  test('should analyze referenced aliases and report context issues', () => {
    const registry = createDefaultDeltaValueRegistry()
    const context = resolveDeltaValueContext(
      {
        main: { id: 1 },
        user: { id: 2 }
      },
      undefined
    )
    const match = registry.detect({ $jina: '$base.name & $user.title & $tenant.title' })
    const analysis = analyzeDeltaValueMatch(match, context)

    deepStrictEqual(extractDeltaExpressionAliases('$base.name & $user.title & $tenant.title'), [
      '$base',
      '$user',
      '$tenant'
    ])
    deepStrictEqual(analysis, {
      aliases: ['$base', '$user', '$tenant'],
      unknownAliases: ['$base', '$tenant'],
      issues: [
        'Expression references $base but target is not selected',
        'Unknown aliases: $base, $tenant'
      ]
    })
    deepStrictEqual(
      formatDeltaValueAnalysisTitle(analysis, 'target=unset; aliases: $sources, $main, $user'),
      'target=unset; aliases: $sources, $main, $user; Expression references $base but target is not selected; Unknown aliases: $base, $tenant'
    )
  })

  test('should collect validation errors for nested delta values', () => {
    const registry = createDefaultDeltaValueRegistry()
    const context = resolveDeltaValueContext(
      {
        main: { id: 1 },
        user: { id: 2 }
      },
      undefined
    )

    deepStrictEqual(
      collectDeltaValueValidationErrors(
        {
          profile: {
            displayName: { $jina: '$base.name & $user.title & $tenant.title' }
          }
        },
        registry,
        context
      ),
      [
        {
          path: ['profile', 'displayName'],
          message: 'Delta value context: Expression references $base but target is not selected',
          severity: 'warning'
        },
        {
          path: ['profile', 'displayName'],
          message: 'Delta value context: Unknown aliases: $base, $tenant',
          severity: 'warning'
        }
      ]
    )
  })

  test('should resolve text diagnostic path to inner directive value', () => {
    const registry = createDefaultDeltaValueRegistry()
    const json = {
      profile: {
        displayName: { $jina: '$base.name' }
      }
    }
    const match = registry.detect(json.profile.displayName)

    deepStrictEqual(resolveDeltaValueExpressionPath(json, ['profile', 'displayName'], match), [
      'profile',
      'displayName',
      '$jina'
    ])
  })
})
