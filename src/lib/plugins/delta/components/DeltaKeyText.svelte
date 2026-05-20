<script lang="ts">
  import type { DeltaLanguageService, DeltaKeyToken } from '$lib/plugins/delta/language/deltaTypes.js'
  import { addNewLineSuffix } from '$lib/utils/domUtils.js'

  export let keyText: string
  export let languageService: DeltaLanguageService

  let tokens: DeltaKeyToken[] = []
  $: tokens = languageService.tokenizeKey(keyText)
</script>

{#if tokens.length === 0}
  {addNewLineSuffix(keyText)}
{:else}
  {#each tokens as token}
    <span
      class:jse-delta-key-token={true}
      class:jse-delta-key-token--directive={token.type === 'directive'}
      class:jse-delta-key-token--path={token.type === 'path'}
      class:jse-delta-key-token--bracket={token.type === 'bracket'}
      class:jse-delta-key-token--operator={token.type === 'operator'}
      class:jse-delta-key-token--number={token.type === 'number'}
      class:jse-delta-key-token--selector-string={token.type === 'selector-string'}
      class:jse-delta-key-token--dot={token.type === 'dot'}
      class:jse-delta-key-token--other={token.type === 'other'}
      class:jse-delta-key-token--bracket-depth-0={token.type === 'bracket' &&
        token.bracketDepth !== undefined &&
        token.bracketDepth % 6 === 0}
      class:jse-delta-key-token--bracket-depth-1={token.type === 'bracket' &&
        token.bracketDepth !== undefined &&
        token.bracketDepth % 6 === 1}
      class:jse-delta-key-token--bracket-depth-2={token.type === 'bracket' &&
        token.bracketDepth !== undefined &&
        token.bracketDepth % 6 === 2}
      class:jse-delta-key-token--bracket-depth-3={token.type === 'bracket' &&
        token.bracketDepth !== undefined &&
        token.bracketDepth % 6 === 3}
      class:jse-delta-key-token--bracket-depth-4={token.type === 'bracket' &&
        token.bracketDepth !== undefined &&
        token.bracketDepth % 6 === 4}
      class:jse-delta-key-token--bracket-depth-5={token.type === 'bracket' &&
        token.bracketDepth !== undefined &&
        token.bracketDepth % 6 === 5}
      >{token.text}</span
    >
  {/each}
  {#if keyText.endsWith('\n')}
    {'\n'}
  {/if}
{/if}
