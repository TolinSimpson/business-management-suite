const fs = require('fs');
const path = require('path');
// Regenerates the dark-themed prompt-builder pages that the Prompt Builder tool
// embeds. Point SRC at a checkout of github.com/TolinSimpson/prompt-builder.
// Usage: node scripts/build-prompt-builder.cjs <path-to-prompt-builder-checkout>
const SRC = process.argv[2] || 'C:/Users/tolin/AppData/Local/Temp/pb';
const OUT = path.join(__dirname, '..', 'src', 'tools', 'prompt-builder');
fs.mkdirSync(OUT, { recursive: true });

const pages = fs.readdirSync(SRC).filter((f) => f.endsWith('.html'));

// One override sheet covering both the hub (index.html) and the builder pages.
// Maps the original light palette onto the app's design tokens (hardcoded hex —
// an iframe doesn't inherit the app's CSS variables).
const overrideCss = `
    <style id="app-theme-override">
      html { color-scheme: dark; }
      body {
        max-width: none; margin: 0; padding: 0 2px;
        color: #e7e9ee; background: transparent;
        font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        -webkit-tap-highlight-color: transparent;
      }
      /* The tool view shows its own title banner — drop the page's big H1. */
      body > h1 { display: none !important; }
      .subtitle { color: #9aa1ad; }
      /* ---- hub (index.html) ---- */
      .card {
        background: #181b22; border: 1px solid #2c313c; color: inherit;
        border-radius: 14px;
      }
      .card:hover { border-color: #6ea8fe; box-shadow: none; transform: none; }
      .card-icon { color: #6ea8fe; }
      .card-title { color: #e7e9ee; }
      .card-desc, .card-platforms { color: #9aa1ad; }
      footer { color: #9aa1ad; }
      footer a { color: #6ea8fe; }
      /* ---- builder pages ---- */
      .step-label, .output-label { color: #9aa1ad; }
      .step-hint, .section-divider { color: #9aa1ad; }
      select, .text-input, .prompt-area {
        color: #e7e9ee; background: #21252e;
        border: 1px solid #2c313c; border-radius: 10px;
      }
      select:focus, .text-input:focus, .prompt-area:focus {
        outline: 2px solid #6ea8fe; border-color: #6ea8fe;
      }
      .checks label {
        color: #e7e9ee; background: #21252e; border: 1px solid #2c313c;
        border-radius: 999px; padding: 0.34rem 0.7rem;
      }
      .checks label:has(input:checked), .checks label.ordered {
        background: #2a3c5e; border-color: #6ea8fe;
      }
      .checks label .order-badge { background: #6ea8fe; color: #0f1115; }
      .preset-btn {
        color: #e7e9ee; background: #21252e; border: 1px solid #2c313c;
        border-radius: 999px;
      }
      .preset-btn:hover { background: #2a3c5e; border-color: #6ea8fe; }
      .preset-btn.active { background: #2a3c5e; border-color: #6ea8fe; font-weight: 600; }
      button {
        color: #e7e9ee; background: #21252e; border: 1px solid #2c313c;
        border-radius: 10px; padding: 0.5rem 1rem;
      }
      button:hover { background: #2a3c5e; }
      .output-section { border-top: 1px solid #2c313c; }
      .prompt-area.secondary { border-color: #b5689a; background: #261f2b; }
      .toast { color: #4ec98a; }
      .pass-label { color: #6ea8fe; }
      .platform-hint {
        color: #e7e9ee; background: #2a3c5e;
        border-left: 3px solid #6ea8fe; border-radius: 8px; padding: 0.5rem 0.7rem;
      }
      [data-tip]::after { background: #21252e; border: 1px solid #6ea8fe; color: #e7e9ee; }
    </style>
`;

// The pages are embedded via the iframe's `srcdoc` (bundled as raw strings, not
// served at URLs), so relative links between them can't navigate on their own.
// This bridge: (1) reports content height so the host can auto-size the frame,
// (2) routes clicks on internal *.html links up to the host (which swaps the
// srcdoc), and (3) opens external links in a new tab.
const bridgeJs = `
    <script>
      (function () {
        function report() {
          parent.postMessage(
            { __promptBuilder: true, height: document.documentElement.scrollHeight },
            "*"
          );
        }
        new ResizeObserver(report).observe(document.documentElement);
        ["input", "change"].forEach(function (ev) {
          document.addEventListener(ev, function () { setTimeout(report, 0); }, true);
        });
        document.addEventListener("click", function (e) {
          var a = e.target && e.target.closest ? e.target.closest("a") : null;
          var href = a ? a.getAttribute("href") || "" : "";
          if (a && /^https?:/i.test(href)) { a.target = "_blank"; a.rel = "noopener"; return; }
          if (a && /\\.html($|[?#])/i.test(href)) {
            e.preventDefault();
            parent.postMessage({ __promptBuilderNav: href.replace(/[?#].*$/, "") }, "*");
            return;
          }
          setTimeout(report, 0);
        }, true);
        window.addEventListener("load", report);
        setTimeout(report, 50);
      })();
    <\/script>
`;

for (const p of pages) {
  let html = fs.readFileSync(path.join(SRC, p), 'utf8');
  html = html.replace('</head>', overrideCss + '</head>');
  html = html.replace('</body>', bridgeJs + '</body>');
  fs.writeFileSync(path.join(OUT, p), html);
}
console.log('themed', pages.length, 'pages ->', OUT);
console.log(pages.join(', '));
