<script lang="ts">
  import "./properties-theme.css";
  import { currentBridgeDlClass, editorBridge } from "$lib/bridge-selection.svelte";
  import BoxModelDiagram from "./BoxModelDiagram.svelte";
  import { selectionIdentity } from "./property-pseudo-state";
  import PropertySection from "./PropertySection.svelte";
  import { getSpacingComputedValues } from "./spacing-computed";
  import {
    emptySpacingDraft,
    spacingDraftFromComputed,
    type SpacingDraft,
    type SpacingFieldKey,
  } from "./spacing-fields";

  const hasSelection = $derived(
    currentBridgeDlClass() !== null && editorBridge.selection !== null,
  );

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state<SpacingDraft>(emptySpacingDraft());

  $effect(() => {
    selectionKey;
    draft = spacingDraftFromComputed(getSpacingComputedValues());
  });

  function onDraftChange(key: SpacingFieldKey, value: string) {
    draft = { ...draft, [key]: value };
  }
</script>

<PropertySection title="Spacing" startExpanded={true}>
  <BoxModelDiagram {draft} disabled={!hasSelection} onDraftChange={onDraftChange} />
</PropertySection>
