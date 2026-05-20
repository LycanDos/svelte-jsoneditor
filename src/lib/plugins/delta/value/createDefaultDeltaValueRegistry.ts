import type {
  DeltaValueLanguageDefinition,
  DeltaValueMatch,
  DeltaValueRegistry
} from './deltaValueTypes.js'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const DEFAULT_DELTA_VALUE_LANGUAGES: DeltaValueLanguageDefinition[] = [
  { id: 'jina', directive: '$jina', label: 'Jina' },
  { id: 'jmes', directive: '$jmes', label: 'JMES' },
  { id: 'java', directive: '$java', label: 'Java' }
]

export function createDefaultDeltaValueRegistry(): DeltaValueRegistry {
  const languages = DEFAULT_DELTA_VALUE_LANGUAGES
  const languageMap = new Map(languages.map((language) => [language.directive, language]))

  return {
    languages,
    detect(value: unknown): DeltaValueMatch | undefined {
      if (!isPlainObject(value)) {
        return undefined
      }

      const keys = Object.keys(value)
      if (keys.length !== 1) {
        return undefined
      }

      const directive = keys[0]
      const language = languageMap.get(directive)

      return language
        ? {
            language,
            expression: value[directive]
          }
        : undefined
    }
  }
}

