<svelte:options immutable={true} />

<script lang="ts">
  import type { JSONPath } from 'immutable-json-patch'
  import type { JSONParser } from '$lib/types'
  import { truncate } from '$lib/utils/stringUtils.js'
  import { MAX_INLINE_OBJECT_CHARS } from '$lib/constants.js'
  import type { DeltaSourceMap } from '$lib/plugins/delta/language/deltaTypes.js'
  import {
    analyzeDeltaValueMatch,
    formatDeltaValueAnalysisTitle
  } from '$lib/plugins/delta/value/analyzeDeltaValue.js'
  import { createDefaultDeltaValueRegistry } from '$lib/plugins/delta/value/createDefaultDeltaValueRegistry.js'
  import { formatDeltaValueContextTitle, resolveDeltaValueContext } from '$lib/plugins/delta/value/resolveDeltaValueContext.js'
  import type { DeltaValueAnalysis, DeltaValueMatch } from '$lib/plugins/delta/value/deltaValueTypes.js'
  import Tag from '$lib/components/controls/Tag.svelte'

  export let path: JSONPath
  export let value: unknown
  export let parser: JSONParser
  export let isSelected: boolean
  export let containsSearchResult: boolean
  export let containsActiveSearchResult: boolean
  export let onEdit: (path: JSONPath) => void
  export let deltaMode = false
  export let deltaTarget: string | undefined = undefined
  export let deltaSources: DeltaSourceMap | undefined = undefined

  const deltaValueRegistry = createDefaultDeltaValueRegistry()
  let deltaValueMatch: DeltaValueMatch | undefined
  $: deltaValueMatch = deltaMode ? deltaValueRegistry.detect(value) : undefined
  let deltaValueAnalysis: DeltaValueAnalysis | undefined
  $: deltaValueAnalysis = deltaValueMatch
    ? analyzeDeltaValueMatch(deltaValueMatch, resolveDeltaValueContext(deltaSources, deltaTarget))
    : undefined
  $: deltaValueTitle = deltaValueMatch
    ? formatDeltaValueAnalysisTitle(
        deltaValueAnalysis,
        `${deltaValueMatch.language.directive}: ${formatDeltaValueContextTitle(
          resolveDeltaValueContext(deltaSources, deltaTarget)
        )}`
      )
    : undefined
</script>

<button
  type="button"
  class="jse-inline-value"
  class:jse-selected={isSelected}
  class:jse-highlight={containsSearchResult}
  class:jse-active={containsActiveSearchResult}
  on:dblclick={() => onEdit(path)}
>
  {#if deltaValueMatch}
    <span title={deltaValueTitle}>
      <Tag>{deltaValueMatch.language.id}</Tag>
    </span>
    {#if deltaValueAnalysis && deltaValueAnalysis.issues.length > 0}
      <span title={deltaValueTitle}>
        <Tag>ctx?</Tag>
      </span>
    {/if}
    &nbsp;
  {/if}
  {truncate(parser.stringify(value) ?? '', MAX_INLINE_OBJECT_CHARS)}
</button>

<style src="./InlineValue.scss"></style>
