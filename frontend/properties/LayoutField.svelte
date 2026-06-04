<script lang="ts">
  import "./properties-theme.css";
  import type { Snippet } from "svelte";

  type Props = {
    label: string;
    class?: string;
    children: Snippet;
  };

  let { label, class: className = "", children }: Props = $props();
</script>

<div class="prop-field {className}">
  <span class="prop-field-label">{label}</span>
  {@render children()}
</div>
