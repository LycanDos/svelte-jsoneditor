<svelte:options immutable={true} />

<script lang="ts">
  import { initial, isEqual } from 'lodash-es'
  import {
    createEditKeySelection,
    createKeySelection,
    createValueSelection,
    isEditingSelection,
    isKeySelection
  } from '$lib/logic/selection.js'
  import SearchResultHighlighter from './highlight/SearchResultHighlighter.svelte'
  import EditableDiv from '../../controls/EditableDiv.svelte'
  import { addNewLineSuffix } from '$lib/utils/domUtils.js'
  import type { ExtendedSearchResultItem, JSONSelection, TreeModeContext } from '$lib/types.js'
  import { UpdateSelectionAfterChange } from '$lib/types.js'
  import { type JSONPath, type JSONPointer, parseJSONPointer } from 'immutable-json-patch'
  import ContextMenuPointer from '../../../components/controls/contextmenu/ContextMenuPointer.svelte'
  import DeltaKeyText from '$lib/plugins/delta/components/DeltaKeyText.svelte'
  import DeltaKeyEditor from '$lib/plugins/delta/components/DeltaKeyEditor.svelte'

  export let pointer: JSONPointer
  export let key: string
  export let selection: JSONSelection | undefined
  export let searchResultItems: ExtendedSearchResultItem[] | undefined
  export let onUpdateKey: (oldKey: string, newKey: string) => string

  export let context: TreeModeContext

  let path: JSONPath
  $: path = parseJSONPointer(pointer)

  $: isKeySelected = isKeySelection(selection) && isEqual(selection.path, path)
  $: isEditingKey = isKeySelected && isEditingSelection(selection)
  $: useDeltaKeyUI = context.deltaMode && context.deltaLanguageService.isDeltaLikeKey(key)

  function handleKeyDoubleClick(
    event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }
  ) {
    if (!isEditingKey && !context.readOnly) {
      event.preventDefault()
      context.onSelect(createEditKeySelection(path))
    }
  }

  function handleChangeValue(newKey: string, updateSelection: UpdateSelectionAfterChange) {
    const updatedKey = onUpdateKey(key, context.normalization.unescapeValue(newKey))
    const updatedPath = initial(path).concat(updatedKey)

    context.onSelect(
      updateSelection === UpdateSelectionAfterChange.nextInside
        ? createValueSelection(updatedPath)
        : createKeySelection(updatedPath)
    )

    if (updateSelection !== UpdateSelectionAfterChange.self) {
      context.focus()
    }
  }

  function handleCancelChange() {
    context.onSelect(createKeySelection(path))
    context.focus()
  }
</script>

{#if !context.readOnly && isEditingKey}
  {#if useDeltaKeyUI}
    <DeltaKeyEditor
      value={context.normalization.escapeValue(key)}
      initialValue={isEditingSelection(selection) ? selection.initialValue : undefined}
      label="Edit key"
      onChange={handleChangeValue}
      onCancel={handleCancelChange}
      onFind={context.onFind}
      languageService={context.deltaLanguageService}
    />
  {:else}
    <EditableDiv
      value={context.normalization.escapeValue(key)}
      initialValue={isEditingSelection(selection) ? selection.initialValue : undefined}
      label="Edit key"
      shortText
      onChange={handleChangeValue}
      onCancel={handleCancelChange}
      onFind={context.onFind}
    />
  {/if}
{:else}
  <div
    role="none"
    data-type="selectable-key"
    class="jse-key"
    class:jse-delta-key={useDeltaKeyUI}
    class:jse-empty={key === ''}
    on:dblclick={handleKeyDoubleClick}
  >
    {#if searchResultItems && !useDeltaKeyUI}
      <SearchResultHighlighter text={context.normalization.escapeValue(key)} {searchResultItems} />
    {:else if useDeltaKeyUI}
      <DeltaKeyText
        keyText={context.normalization.escapeValue(key)}
        languageService={context.deltaLanguageService}
      />
    {:else}
      {addNewLineSuffix(context.normalization.escapeValue(key))}
    {/if}
  </div>
{/if}
{#if !context.readOnly && isKeySelected && !isEditingKey}
  <ContextMenuPointer selected={true} onContextMenu={context.onContextMenu} />
{/if}

<style src="./JSONKey.scss"></style>
