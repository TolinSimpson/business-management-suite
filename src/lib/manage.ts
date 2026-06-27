// Shared helper for building share links from the current page.

/** The page origin with any existing hash/query stripped. */
export function cleanOrigin(): string {
  return (location.origin + location.pathname).replace(/[#?].*$/, "");
}
