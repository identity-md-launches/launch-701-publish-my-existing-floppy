# Validation — FLOPPY PEPE

Worker report, 2026-10-04. This is recorded evidence, not independent certification.

## Scope and result

**Playable practice fallback: complete and locally verified. Public publication: blocked. Full operational competition: incomplete.**

The former status page has been replaced with the original React arcade requested by this assignment. The review covers the complete one-page production export and ready, running, paused, round-over, empty leaderboard, disabled claim, nickname, Info, Stats and share states. Original canvas/SVG art was created without consulting the previous reference website. The existing build configuration and dependencies were retained.

The supplied backend-access fallback applies: score submission and Daily Claim are disabled, no launch time or countdown exists, and the interface repeatedly identifies practice mode. A browser-only identity and stats are explicitly described as device-only, not authoritative shared records. No token, entry fee or automatic payment exists.

Public hosting was attempted twice. The available Cloudflare token was active and could list Worker scripts, but both finished-export uploads returned **HTTP 403 / No access to the specified resource**. D1 listing returned HTTP 401; Durable Object namespace and account subdomain access returned HTTP 403. No IPFS/ENS connector or pinning credential was exposed. The source/export are ready for the external submission publisher, but no new public URL or CID was obtained. No earlier hosted version is represented as this new game.

## Actual commands and outcomes

Run with Node 22.23.3 and npm 10.9.9 in `/tmp/floppy-pepe-game-build`, copied from the repository. Dependencies, npm cache and Chromium downloads stayed under `/tmp/`.

| Command | Result |
| --- | --- |
| `npm --prefix /tmp/floppy-pepe-game-build ci --cache /tmp/floppy-pepe-npm-cache` | Exit 0; 29 packages; 0 reported vulnerabilities |
| `npm --prefix /tmp/floppy-pepe-game-build run typecheck` | Exit 0 after final source change |
| `npm --prefix /tmp/floppy-pepe-game-build run build` | Exit 0 after final source change; complete Vite production export |
| `node --experimental-strip-types scripts/check-game.mjs` | Exit 0; nine behavior checks; [results](evidence/game-check.json) |
| `node scripts/check-export.mjs` | Exit 0 on delivered export; [relative assets and byte count](evidence/export-check.json) |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/floppy-pepe-playwright-browsers npm --prefix /tmp/floppy-pepe-game-build run check:browser` | Exit 0 after final source change; [results](evidence/browser-check.json) |
| `node scripts/publish.mjs --dry-run` | Exit 0; [final export manifest](evidence/publish-manifest.json) |
| `node scripts/publish.mjs` | Exit 1; static-asset manifest denied with HTTP 403; [raw result](evidence/publication-static-assets.json) |
| `node scripts/publish.mjs --inline` | Exit 1; direct Worker upload denied with HTTP 403; [raw result](evidence/publication.json) |

Publication attempts preceded the last small Escape/name-focus fixes; both failed before creating a deployment. The final manifest identifies the subsequently rebuilt export. Another upload with the same rejected access was not represented as successful.

The browser script serves `dist/` at a gateway-like `/preview/` subpath in a bounded foreground process, then closes its server and Chromium. Its recorded loopback URL is evidence of a local check, not a deliverable public URL. Browser output refers to the script's `artifacts/` directory; copies are delivered in `docs/evidence/` because the pre-existing Git exclude ignores `artifacts/`. No ignore file was changed.

## Gameplay and interaction evidence

Engine checks cover upward hop, gravity, ground collision, ceiling collision, RAM collision with no award, +1 normal passage and +3 gold passage awarded only once, level thresholds at 10/20/30, increasing speed, narrowing gaps, level-3 vertical motion, and deterministic replay from equal seeds/inputs. See `scripts/check-game.mjs` and `src/engine.ts:10`.

Chromium ran in new anonymous browser contexts at 320×1000, 390×1000, 768×1000 and 1280×1000 CSS pixels. No login, owner permission or external runtime asset was used. At each width it verified:

- Both SVG images load, the canvas renders, the claim panel appears beside the cabinet on desktop and above it on mobile, and the page does not overflow horizontally.
- Play, keyboard Space, click or emulated touch on the canvas, pause, resume, a real timed ground collision, Play again and RESET. Space leaves page scroll unchanged while hopping.
- RESET clears the current score while retaining the completed-round count. Stats and Info dialogs open and close; Escape returns focus to the trigger. Escape also pauses while the sound button has focus.
- An empty nickname produces an inline error, invalid state and input focus. Saving a name survives reload.
- Sound toggles and reflects its pressed state. Instrumented **real Web Audio** oscillators start on enable and hop; muting prevents additional starts. This tests generation, not listening through physical speakers.
- The exact reward statement, disabled claims and correct external IMD URL.

A separate production-canvas run observed rendered blue-shirt/RAM pixels and supplied normal Space events using a virtual clock. It reached **23 points and level 3**, then checked that the best survives death and reload. No game-state injection, artificial score setter or production test hook was used. The first test harness mistook green RAM for the frog and failed after 1 point; detecting the blue shirt corrected the test, and repeated full runs passed. This was a test-observation issue, not evidence of a scoring defect.

Sharing copied the game URL and practice best; with clipboard/native share deliberately unavailable it showed selectable copy text. Disabling storage did not prevent play and produced a visible warning. Final browser runs recorded **zero console/runtime/resource errors**. Native mobile share-sheet presentation was not exercised.

## Better Interface — six-domain coverage

The pinned workflow and each domain's core principles were read and applied during implementation. The consolidated review below is based on source and actual Chromium export checks, not assumed browser behavior.

| Domain | Coverage and evidence | Limits |
| --- | --- | --- |
| Accessibility | **Checked.** Native buttons, link/table/form/dialog semantics; canvas keyboard input and label; Space prevention; form error/focus; modal focus return; visible Play focus screenshot; reduced-motion CSS; named sound/pause controls. Axe reported 0 violations in ready and Info states at all four widths. | No screen-reader session, forced-colors render, comprehensive every-target focus screenshots or physical-device testing. Reflex canvas gameplay has no nonvisual equivalent. |
| Layout | **Checked.** Screenshots reviewed at 320, 390, 768 and 1280; claim ordering, cabinet emphasis, table wrapping and no page overflow. Source media queries match the observed layouts. | Native browser 200% zoom and text-only enlargement unperformed. RTL/localization not implemented. |
| Writing | **Checked.** All action labels map to handlers; prize text exact; disabled-claim explanation; truthful practice/empty/status copy; device-saved identity wording; nickname recovery and share fallback. | No operational backend loading/saving/error copy can be tested; those states do not exist in this fallback. |
| Typography | **Checked.** System stacks, hierarchy, mono numeric scores, line height and wrapping reviewed in source/screenshots. Input font 16px. | Tiny 6–11px supplementary arcade labels are intentional but may be difficult for low-vision players. System font rendering differs by platform; text enlargement not certified. |
| Colors | **Checked.** Semantic token audit, actual computed solid foreground/background pairs, final axe scans. Primary 12.74:1; practice badge 9.16:1; main panel 15.47:1; arcade control 10.02:1; leaderboard secondary text 7.01:1. | No claim of measured contrast for every canvas pixel, translucent game-over background or every focus-adjacent color. Light theme is not applicable. |
| UI | **Checked.** Consistent cabinet/panel radii, shared icon strokes, ready/playing/paused/over controls, native disabled claims, empty leaderboard, form error and sharing fallback. Motion is restrained and guarded; idle canvas is static. | Motion was not replayed in the Animations panel at 10% speed. Safari/Firefox and native share sheets unperformed. |

## Findings, fixes and rechecks

| Severity / location | Evidence and impact | Correction and recheck |
| --- | --- | --- |
| High — `src/main.tsx:130` (replaced former status surface) | Initial source had no game or gameplay handlers. This blocked the primary task. | Replaced it with the playable cabinet, engine/art, controls and practice state. Full production interaction tests pass. |
| Medium — `src/styles.css:131`, `src/main.tsx:189` | Initial desktop axe run flagged the low-contrast decorative `.empty-dashes` text. | Removed that element from the leaderboard. No such text is rendered; final axe scans have 0 violations. |
| Low — `src/main.tsx:149` / `src/styles.css:180` | The inspected 320px screenshot read “storage.Nothing” because a hidden `<br>` removed separation. | Added explicit whitespace; final 320/390 screenshots show correct word separation. |
| Medium — `src/main.tsx:91` | Source review showed the interactive-target guard returned before Escape handling; Escape could not pause after selecting sound. | Handle Escape first. Browser regression focuses sound, presses Escape and confirms paused state at all widths. |
| Medium — `src/main.tsx:200` | Source review found empty-name submission left focus on Save. | Focus the invalid input on submission. Browser verifies both `aria-invalid` and active input. |

No unresolved observed primary practice-game failure remains. The backend and public-hosting blockers are material scope limits, not design findings fixed by the frontend.

## Screenshots and limitations

Final production evidence was saved and visually inspected:

- [320px mobile](evidence/game-320.png)
- [390px mobile](evidence/game-390.png)
- [768px intermediate](evidence/game-768.png)
- [1280px desktop and Play focus](evidence/game-1280.png)
- [23 points / level 3, paused](evidence/game-level-3.png)

Shared rankings, cross-browser shared identity, server replay verification, UTC claims, concurrent transactions and the ten-day cutoff were **not run**: there is no connected backend. Public anonymous loading and play were **not verified** because publishing was denied. Only anonymous local production-export access was verified. The README specifies the necessary hosting/storage access and remaining integration.

The normal Git index is untouched under the task's protected-path rule. Source, preserved manifest/lockfile and final `dist/` are supplied for the submission collector. No dependencies, caches, submodules or archives are included. See `evidence/submission-inventory.json` for the final byte/path check.
