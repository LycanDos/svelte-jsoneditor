import type { JSONPath } from 'immutable-json-patch'
import type { ValidationError } from '$lib/types.js'
import { ValidationSeverity } from '$lib/types.js'
import { analyzeDeltaValueMatch } from './analyzeDeltaValue.js'
import type { DeltaValueContext, DeltaValueRegistry } from './deltaValueTypes.js'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function collectDeltaValueValidationErrors(
  json: unknown,
  registry: DeltaValueRegistry,
  context: DeltaValueContext
): ValidationError[] {
  const errors: ValidationError[] = []

  function visit(value: unknown, path: JSONPath) {
    const match = registry.detect(value)
    const analysis = analyzeDeltaValueMatch(match, context)

    if (analysis) {
      for (const issue of analysis.issues) {
        errors.push({
          path,
          message: `Delta value context: ${issue}`,
          severity: ValidationSeverity.warning
        })
      }
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, path.concat(String(index))))
      return
    }

    if (isPlainObject(value)) {
      for (const [key, child] of Object.entries(value)) {
        visit(child, path.concat(key))
      }
    }
  }

  visit(json, [])

  return errors
}
