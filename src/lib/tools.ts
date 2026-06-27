import type { Component } from "svelte";
import { writable } from "svelte/store";

// Which tool is currently open in the Tools tab (null = the list). Shared so the
// footer Tools button can return to the list while a tool is open.
export const openToolId = writable<string | null>(null);

// Modular tools registry. Drop a self-contained `.svelte` file into `src/tools/`
// and it shows up in the Tools tab automatically — no wiring needed. Each tool
// declares its metadata via a module-level `export const meta` in a
// `<script module>` block, e.g.:
//
//   <script module lang="ts">
//     export const meta = { name: "Calculator", icon: "🧮", description: "…" };
//   </script>

export interface ToolMeta {
  name: string;
  /** an Icon component name (see components/Icon.svelte), not an emoji */
  icon?: string;
  description?: string;
  /** lower sorts first; defaults to 0 */
  order?: number;
  /** management-only: requires the admin gate to open */
  admin?: boolean;
}

export interface Tool {
  id: string;
  meta: ToolMeta;
  Component: Component;
}

// Eagerly bundle every tool so the registry is ready synchronously.
const modules = import.meta.glob("../tools/*.svelte", { eager: true }) as Record<
  string,
  { default: Component; meta?: ToolMeta }
>;

export const tools: Tool[] = Object.entries(modules)
  .map(([path, mod]) => {
    const id = path.split("/").pop()!.replace(/\.svelte$/, "");
    return { id, Component: mod.default, meta: mod.meta ?? { name: id } };
  })
  .sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0) || a.meta.name.localeCompare(b.meta.name));
