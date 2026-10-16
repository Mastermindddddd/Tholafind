# Tholafind browser extension

Right-click any image, or drag a crop box over anything on the page, and a Tholafind hunt opens in a side panel — no tab switch.

## Install / build
```
cd extension
npm install && npm run vendor      # copies the on-device OCR engine into vendor/ (needs npm access)
npm run build                      # dist/chrome and dist/firefox (base = https://www.tholafind.com)
node scripts/build.mjs --target chrome --base http://localhost:3000 --dev    # local dev
```
- **Chrome/Edge/Brave:** `chrome://extensions` → Developer mode → Load unpacked → `dist/chrome`.
- **Firefox (128+):** `about:debugging` → This Firefox → Load Temporary Add-on → `dist/firefox/manifest.json`. Allow the site permission when asked.
- **Safari:** `node scripts/build.mjs --target safari`, then on a Mac: `xcrun safari-web-extension-converter dist/safari`. Needs Xcode; **not tested**.

First use: click the toolbar icon → **Connect account** (opens `/extension/connect`, you must be signed in).

## Using it
- Right-click an image → **Hunt this on Tholafind**. Many sites (Instagram, TikTok) put an invisible layer over photos so the browser sees no image; use **Crop an area & hunt** (right-click the page, toolbar popup, or Alt+Shift+T).
- Panel shows matches with `NN% match`. If confidence is low it asks for brand / material / colour and re-searches.

## Roadmap status
| Phase | Status |
|---|---|
| 1 Capture: right-click + crop overlay, on-device OCR, Chrome/Firefox | Built. Chrome flow tested end to end with a mock server. Real OCR untested (see below). Safari untested. |
| 2 Pivot: parallel catalog search + attribute prompts | Prompts built. Server searches Google Lens (retail), eBay, Etsy. **Poshmark, Mercari, Depop, Grailed have no public search API and are not integrated** (Grailed only appears if Lens/eBay surface it). |
| 3 Verify: drop dead/sold-out listings | Built server-side (`inspectListing`, used by `runSearch`). Verified in-stock results get "Listing confirmed in stock". Sites that block server fetches are kept as "unverified". |
| 4 Watch: price ceiling, daily monitor, alerts | **Not built.** Needs your existing watch/alert models and routes. |

## Backend files (copy into the Next.js app)
`lib/models/ExtensionToken.ts`, `lib/extension/*`, `app/api/extension/{token,me,hunt,hunt/[id]}/route.ts`, `app/extension/connect/page.tsx`, `components/ConnectExtensionButton.tsx`, plus edits to `lib/models/Search.ts`, `lib/search/priceResolver.ts`, `lib/search/runSearch.ts`.

## Permissions (why)
`contextMenus` right-click entries · `activeTab` + `scripting` show the panel/crop overlay and capture the tab only when you invoke it · `storage` your pairing token · `offscreen` (Chrome) runs OCR · host access to tholafind.com only, for API calls.
No `<all_urls>`, no always-on content scripts (the only one runs on `/extension/connect`).

## Privacy: what leaves your browser
Only on a hunt you start: the cropped/downloaded image (re-encoded JPEG, ≤1600px, max 8 MB), any text OCR read from it, and the **hostname** of the page (e.g. `pinterest.com`, never the URL). The token is revocable (popup → Disconnect) and only authorises starting hunts and reading their results.

## Known limits
- Real tesseract OCR could not be run where this was built (npm blocked). If `vendor/` is missing or OCR fails/times out (15s), the hunt proceeds and the server does its own OCR.
- Panel images only show when the host page's CSP allows them.
- The browser's own context-menu click and activeTab grant can't be automated; tests call the same handlers directly (test build adds `<all_urls>`). Test: `npm test` (needs Playwright + Chromium).
