import type { DeltaKeyToken, DeltaLanguageService } from './deltaTypes.js'

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_]/.test(char)
}

function isIdentifierPart(char: string): boolean {
  return /[A-Za-z0-9_-]/.test(char)
}

function computeBracketDepths(tokens: DeltaKeyToken[]): DeltaKeyToken[] {
  const depthStack: number[] = []
  let nextDepth = 0

  return tokens.map((token) => {
    if (token.type !== 'bracket') {
      return token
    }

    if (token.text === '[' || token.text === '(') {
      const bracketDepth = depthStack.length === 0 ? nextDepth++ : depthStack.length
      depthStack.push(bracketDepth)
      return { ...token, bracketDepth }
    }

    if (token.text === ']' || token.text === ')') {
      const bracketDepth = depthStack.length > 0 ? depthStack.pop() : undefined
      return { ...token, bracketDepth }
    }

    return token
  })
}

export function createDefaultDeltaLanguageService(): DeltaLanguageService {
  function isDeltaLikeKey(key: string): boolean {
    return (
      key.startsWith('$') ||
      key.includes('.') ||
      key.includes('[') ||
      key.includes(']') ||
      key.includes('+') ||
      key.includes('-') ||
      key.includes("'") ||
      key.includes('=')
    )
  }

  function tokenizeKey(key: string): DeltaKeyToken[] {
    const tokens: DeltaKeyToken[] = []
    let index = 0

    while (index < key.length) {
      const current = key[index]

      if (current === '$') {
        let end = index + 1
        while (end < key.length && isIdentifierPart(key[end])) {
          end += 1
        }
        tokens.push({
          type: 'directive',
          text: key.slice(index, end),
          start: index,
          end
        })
        index = end
        continue
      }

      if (current === "'") {
        let end = index + 1
        while (end < key.length) {
          if (key[end] === "'" && key[end - 1] !== '\\') {
            end += 1
            break
          }
          end += 1
        }
        tokens.push({
          type: 'selector-string',
          text: key.slice(index, end),
          start: index,
          end
        })
        index = end
        continue
      }

      if (/\d/.test(current)) {
        let end = index + 1
        while (end < key.length && /\d/.test(key[end])) {
          end += 1
        }
        tokens.push({
          type: 'number',
          text: key.slice(index, end),
          start: index,
          end
        })
        index = end
        continue
      }

      if (isIdentifierStart(current)) {
        let end = index + 1
        while (end < key.length && isIdentifierPart(key[end])) {
          end += 1
        }
        tokens.push({
          type: 'path',
          text: key.slice(index, end),
          start: index,
          end
        })
        index = end
        continue
      }

      if ('[]()'.includes(current)) {
        tokens.push({
          type: 'bracket',
          text: current,
          start: index,
          end: index + 1
        })
        index += 1
        continue
      }

      if (
        key.startsWith('+>', index) ||
        key.startsWith('->', index) ||
        key.startsWith('>=', index) ||
        key.startsWith('<=', index) ||
        key.startsWith('!=', index)
      ) {
        tokens.push({
          type: 'operator',
          text: key.slice(index, index + 2),
          start: index,
          end: index + 2
        })
        index += 2
        continue
      }

      if ('.:=+-><,'.includes(current)) {
        tokens.push({
          type: current === '.' ? 'dot' : 'operator',
          text: current,
          start: index,
          end: index + 1
        })
        index += 1
        continue
      }

      tokens.push({
        type: 'other',
        text: current,
        start: index,
        end: index + 1
      })
      index += 1
    }

    return computeBracketDepths(tokens)
  }

  function findMatchingBracket(tokens: DeltaKeyToken[], tokenIndex: number): number {
    const token = tokens[tokenIndex]
    if (!token || token.type !== 'bracket') {
      return -1
    }

    const pairs: Record<string, string> = {
      '[': ']',
      ']': '[',
      '(': ')',
      ')': '('
    }

    const target = pairs[token.text]
    if (!target) {
      return -1
    }

    const isOpening = token.text === '[' || token.text === '('
    const step = isOpening ? 1 : -1
    let depth = 1

    for (let index = tokenIndex + step; index >= 0 && index < tokens.length; index += step) {
      const current = tokens[index]
      if (current.type !== 'bracket') {
        continue
      }

      if (current.text === token.text) {
        depth += 1
      } else if (current.text === target) {
        depth -= 1
        if (depth === 0) {
          return index
        }
      }
    }

    return -1
  }

  function getBracketDepth(tokens: DeltaKeyToken[], tokenIndex: number): number | undefined {
    return tokens[tokenIndex]?.bracketDepth
  }

  return {
    isDeltaLikeKey,
    tokenizeKey,
    findMatchingBracket,
    getBracketDepth
  }
}
