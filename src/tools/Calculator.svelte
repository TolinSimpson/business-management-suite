<script module lang="ts">
  // Tool metadata — read by the Tools registry (lib/tools.ts).
  export const meta = {
    name: "Calculator",
    icon: "calculator",
    description: "A simple four-function calculator",
    order: 1,
  };
</script>

<script lang="ts">
  // Self-contained: no app state, no external deps.
  let display = $state("0");
  let acc = $state<number | null>(null); // accumulated value
  let op = $state<string | null>(null); // pending operator
  let fresh = $state(true); // next digit starts a new number

  function inputDigit(d: string) {
    if (fresh) {
      display = d === "." ? "0." : d;
      fresh = false;
    } else if (d === "." && display.includes(".")) {
      // ignore second dot
    } else {
      display = display === "0" && d !== "." ? d : display + d;
    }
  }

  function apply(a: number, b: number, o: string): number {
    switch (o) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function chooseOp(next: string) {
    const cur = parseFloat(display);
    if (op !== null && !fresh) {
      acc = apply(acc ?? 0, cur, op);
      display = format(acc);
    } else {
      acc = cur;
    }
    op = next;
    fresh = true;
  }

  function equals() {
    if (op === null) return;
    const cur = parseFloat(display);
    acc = apply(acc ?? 0, cur, op);
    display = format(acc);
    op = null;
    fresh = true;
  }

  function clear() {
    display = "0";
    acc = null;
    op = null;
    fresh = true;
  }

  function negate() {
    if (display !== "0") display = display.startsWith("-") ? display.slice(1) : "-" + display;
  }

  function percent() {
    display = format(parseFloat(display) / 100);
    fresh = true;
  }

  function format(n: number): string {
    if (!isFinite(n)) return "Error";
    return String(Math.round(n * 1e10) / 1e10);
  }

  const keys = [
    ["AC", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];
  function press(k: string) {
    if (k === "AC") clear();
    else if (k === "±") negate();
    else if (k === "%") percent();
    else if (k === "=") equals();
    else if (["+", "−", "×", "÷"].includes(k)) chooseOp(k);
    else inputDigit(k);
  }
</script>

<div class="card">
  <div class="calc-display">{display}</div>
  <div class="calc-grid">
    {#each keys as row}
      {#each row as k}
        <button
          class:op={["÷", "×", "−", "+", "="].includes(k)}
          class:wide={k === "0"}
          onclick={() => press(k)}
        >{k}</button>
      {/each}
    {/each}
  </div>
</div>

<style>
  .calc-display {
    text-align: right;
    font-size: 2.4rem;
    font-weight: 600;
    padding: 12px 8px;
    overflow-x: auto;
    font-variant-numeric: tabular-nums;
  }
  .calc-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .calc-grid button {
    padding: 16px 0;
    font-size: 1.2rem;
  }
  .calc-grid button.op {
    background: var(--accent-dim);
    border-color: var(--accent);
    color: var(--accent);
  }
  .calc-grid button.wide {
    grid-column: span 2;
  }
</style>
