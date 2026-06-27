<script lang="ts">
  // Dependency-free SVG donut chart. Each segment is a stroked arc on a circle,
  // sized via stroke-dasharray and positioned via stroke-dashoffset. A single
  // 100% segment renders as a full ring; zero-value segments are invisible.
  interface Segment {
    label: string;
    value: number;
    color: string;
  }
  let {
    segments,
    size = 180,
    thickness = 26,
    center = "",
  }: { segments: Segment[]; size?: number; thickness?: number; center?: string } = $props();

  let r = $derived((size - thickness) / 2);
  let c = $derived(2 * Math.PI * r);
  let total = $derived(segments.reduce((s, x) => s + Math.max(0, x.value), 0));

  // Cumulative offsets so each arc starts where the previous one ended.
  let slices = $derived.by(() => {
    let acc = 0;
    return segments.map((seg) => {
      const frac = total > 0 ? Math.max(0, seg.value) / total : 0;
      const out = { ...seg, len: frac * c, offset: acc * c };
      acc += frac;
      return out;
    });
  });
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" role="img" aria-label="Budget breakdown">
  <g transform="rotate(-90 {size / 2} {size / 2})">
    <circle
      cx={size / 2}
      cy={size / 2}
      {r}
      fill="none"
      stroke="var(--line)"
      stroke-width={thickness}
    />
    {#each slices as s (s.label)}
      {#if s.len > 0}
        <circle
          cx={size / 2}
          cy={size / 2}
          {r}
          fill="none"
          stroke={s.color}
          stroke-width={thickness}
          stroke-dasharray="{s.len} {c - s.len}"
          stroke-dashoffset={-s.offset}
        />
      {/if}
    {/each}
  </g>
  {#if center}
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="center">
      {center}
    </text>
  {/if}
</svg>

<style>
  svg {
    display: block;
  }
  .center {
    fill: var(--text);
    font-size: 0.95rem;
    font-weight: 700;
  }
</style>
