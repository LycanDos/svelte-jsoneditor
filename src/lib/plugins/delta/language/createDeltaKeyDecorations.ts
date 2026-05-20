import { RangeSetBuilder } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view'
import type { DeltaKeyToken, DeltaLanguageService } from './deltaTypes.js'

const PROPERTY_KEY_RE = /"((?:\\.|[^"\\])*)"(?=\s*:)/g

function depthClass(depth: number | undefined): string {
  if (depth === undefined) {
    return ''
  }

  return ` jse-delta-key-token--bracket-depth-${depth % 6}`
}

function tokenClass(token: DeltaKeyToken): string {
  const classes = [`jse-delta-key-token`, `jse-delta-key-token--${token.type}`]
  if (token.type === 'bracket') {
    classes.push(`jse-delta-key-token--bracket${depthClass(token.bracketDepth)}`)
  }
  return classes.join(' ')
}

function bracketTokenIndexAt(tokens: DeltaKeyToken[], position: number): number {
  const exact = tokens.findIndex(
    (token) =>
      token.type === 'bracket' &&
      ((position >= token.start && position < token.end) || position === token.end)
  )
  if (exact !== -1) {
    return exact
  }

  return tokens.findIndex((token) => token.type === 'bracket' && position === token.start + 1)
}

function buildDecorations(view: EditorView, service: DeltaLanguageService): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const source = view.state.doc.toString()
  const cursor = view.state.selection.main.head

  for (const match of source.matchAll(PROPERTY_KEY_RE)) {
    const rawKey = match[1] ?? ''
    if (match.index == null || !service.isDeltaLikeKey(rawKey)) {
      continue
    }

    const tokens = service.tokenizeKey(rawKey)
    const keyStart = match.index + 1
    const keyEnd = keyStart + rawKey.length
    const cursorInKey = cursor >= keyStart && cursor <= keyEnd
    const activeTokenIndex = cursorInKey ? bracketTokenIndexAt(tokens, cursor - keyStart) : -1
    const matchedTokenIndex =
      activeTokenIndex !== -1 ? service.findMatchingBracket(tokens, activeTokenIndex) : -1

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index]
      let className = tokenClass(token)
      if (index === activeTokenIndex) {
        className += ' jse-delta-key-token--active-bracket'
      }
      if (index === matchedTokenIndex) {
        className += ' jse-delta-key-token--matched-bracket'
      }

      builder.add(
        keyStart + token.start,
        keyStart + token.end,
        Decoration.mark({
          class: className
        })
      )
    }
  }

  return builder.finish()
}

function decorateSingleKey(
  builder: RangeSetBuilder<Decoration>,
  rawKey: string,
  keyStart: number,
  cursor: number,
  service: DeltaLanguageService
) {
  const tokens = service.tokenizeKey(rawKey)
  const keyEnd = keyStart + rawKey.length
  const cursorInKey = cursor >= keyStart && cursor <= keyEnd
  const activeTokenIndex = cursorInKey ? bracketTokenIndexAt(tokens, cursor - keyStart) : -1
  const matchedTokenIndex =
    activeTokenIndex !== -1 ? service.findMatchingBracket(tokens, activeTokenIndex) : -1

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    let className = tokenClass(token)
    if (index === activeTokenIndex) {
      className += ' jse-delta-key-token--active-bracket'
    }
    if (index === matchedTokenIndex) {
      className += ' jse-delta-key-token--matched-bracket'
    }

    builder.add(
      keyStart + token.start,
      keyStart + token.end,
      Decoration.mark({
        class: className
      })
    )
  }
}

export function createDeltaKeyDecorations(service: DeltaLanguageService) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, service)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildDecorations(update.view, service)
        }
      }
    },
    {
      decorations: (value) => value.decorations
    }
  )
}

export function createRawDeltaKeyDecorations(service: DeltaLanguageService) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>()
        decorateSingleKey(builder, view.state.doc.toString(), 0, view.state.selection.main.head, service)
        this.decorations = builder.finish()
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          const builder = new RangeSetBuilder<Decoration>()
          decorateSingleKey(
            builder,
            update.view.state.doc.toString(),
            0,
            update.view.state.selection.main.head,
            service
          )
          this.decorations = builder.finish()
        }
      }
    },
    {
      decorations: (value) => value.decorations
    }
  )
}
