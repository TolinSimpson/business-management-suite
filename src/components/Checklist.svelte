<script lang="ts">
  interface Props {
    items: { step: string; done: boolean }[];
    onToggle: (step: string) => void;
  }
  let { items, onToggle }: Props = $props();
</script>

{#if items.length}
  <div class="checklist">
    {#each items as item}
      <div
        class="check"
        class:done={item.done}
        role="button"
        tabindex="0"
        onclick={() => onToggle(item.step)}
        onkeydown={(e) => (e.key === "Enter" || e.key === " ") && onToggle(item.step)}
      >
        <span class="box">{item.done ? "✓" : ""}</span>
        <span class="lbl">{item.step}</span>
      </div>
    {/each}
  </div>
{:else}
  <p class="muted">No checklist for this block.</p>
{/if}
