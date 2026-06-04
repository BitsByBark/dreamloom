<script lang="ts">
  import ClassSelector from "$properties/ClassSelector.svelte";
  import ElementInfoBar from "$properties/ElementInfoBar.svelte";
  import LayoutSection from "$properties/LayoutSection.svelte";
  import SizeSection from "$properties/SizeSection.svelte";
  import SpacingSection from "$properties/SpacingSection.svelte";
  import StateSelector from "$properties/StateSelector.svelte";
  import TypographySection from "$properties/TypographySection.svelte";
</script>

<div class="properties-panel">
  <ElementInfoBar />
  <ClassSelector />
  <StateSelector />
  <LayoutSection />
  <SpacingSection />
  <SizeSection />
  <TypographySection />
</div>

<style>
  .properties-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: auto;
    background: var(--bg);
    font: inherit;
  }
</style>
