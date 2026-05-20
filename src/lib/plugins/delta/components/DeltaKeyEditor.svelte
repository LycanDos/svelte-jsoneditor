<script lang="ts">
  import { EditorState } from '@codemirror/state'
  import { EditorView, keymap } from '@codemirror/view'
  import { defaultKeymap } from '@codemirror/commands'
  import { onDestroy, onMount } from 'svelte'
  import type { OnFind } from '$lib/types'
  import { UpdateSelectionAfterChange } from '$lib/types'
  import type { DeltaLanguageService } from '$lib/plugins/delta/language/deltaTypes.js'
  import { createRawDeltaKeyDecorations } from '$lib/plugins/delta/language/createDeltaKeyDecorations.js'

  export let value: string
  export let initialValue: string | undefined
  export let label: string
  export let onChange: (newValue: string, updateSelection: UpdateSelectionAfterChange) => void
  export let onCancel: () => void
  export let onFind: OnFind
  export let languageService: DeltaLanguageService

  let container: HTMLDivElement | undefined
  let view: EditorView | undefined
  let closed = false

  function currentValue(): string {
    return view?.state.doc.toString() ?? value
  }

  function closeWithChange(selectionMode: UpdateSelectionAfterChange) {
    closed = true
    onChange(currentValue(), selectionMode)
  }

  function cancelEdit() {
    closed = true
    onCancel()
  }

  onMount(() => {
    if (!container) {
      return
    }

    view = new EditorView({
      state: EditorState.create({
        doc: initialValue ?? value,
        extensions: [
          createRawDeltaKeyDecorations(languageService),
          EditorView.lineWrapping,
          EditorView.theme({
            '&': {
              fontFamily: 'var(--jse-font-family-mono, monospace)',
              fontSize: 'inherit'
            },
            '.cm-content': {
              padding: '0 4px',
              whiteSpace: 'pre-wrap'
            },
            '.cm-scroller': {
              fontFamily: 'inherit'
            },
            '&.cm-editor': {
              outline: 'var(--jse-edit-outline, 1px solid #93c5fd)',
              background: 'var(--jse-background-color, #fff)'
            }
          }),
          EditorView.domEventHandlers({
            blur: () => {
              if (!closed) {
                closeWithChange(UpdateSelectionAfterChange.self)
              }
            }
          }),
          keymap.of([
            {
              key: 'Escape',
              run: () => {
                cancelEdit()
                return true
              }
            },
            {
              key: 'Enter',
              run: () => {
                closeWithChange(UpdateSelectionAfterChange.nextInside)
                return true
              }
            },
            {
              key: 'Tab',
              run: () => {
                closeWithChange(UpdateSelectionAfterChange.nextInside)
                return true
              }
            },
            {
              key: 'Mod-f',
              run: () => {
                onFind(false)
                return true
              }
            },
            {
              key: 'Mod-h',
              run: () => {
                onFind(true)
                return true
              }
            },
            ...defaultKeymap
          ])
        ]
      }),
      parent: container
    })

    view.focus()
    const length = view.state.doc.length
    view.dispatch({
      selection: { anchor: length, head: length }
    })
  })

  onDestroy(() => {
    if (!closed && view && currentValue() !== value) {
      onChange(currentValue(), UpdateSelectionAfterChange.no)
    }
    view?.destroy()
  })
</script>

<div role="textbox" aria-label={label} class="jse-delta-key-editor" bind:this={container}></div>

<style>
  .jse-delta-key-editor {
    display: inline-block;
    min-width: 2em;
    vertical-align: top;
  }
</style>
