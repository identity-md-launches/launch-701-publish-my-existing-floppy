# FLOPPY PEPE — implemented design

The final React source is an original, compact arcade with a dark navy cabinet, lime controls, pixel Pepe in a blue shirt, computer RAM obstacles and a small gold chest. The playable canvas is the main action. This export explicitly runs in practice mode; its leaderboard and disabled claim panel do not imply a live prize competition.

## Source and reuse points

- `src/main.tsx`: page, cabinet, scoreboard, arcade navigation, claim panel, leaderboard and native dialogs. `Icon` supplies the shared 24-unit SVG icon system with 1.7-unit rounded strokes.
- `src/styles.css`: semantic colors, system font stacks, component states and responsive layout.
- `src/engine.ts`: fixed 60-step-per-second simulation, collision and scoring rules.
- `src/art.ts`: original canvas drawing functions `pepe`, `ram` and `draw`. World size 600 × 430; floor begins at y=402. The canvas scales proportionally and uses pixelated rendering.
- `public/pepe.svg`, `public/chest.svg`: original pixel vector artwork. The first also serves as the favicon. No image CDN, web font or external runtime asset is needed.
- `src/sound.ts`: brief square-wave Web Audio sounds, off until enabled. `src/storage.ts`: device-only practice profile and safe persistence fallback.

## Tokens and color roles

The source uses a hex palette with primitive and semantic CSS custom properties. Detailed circuit-board artwork has its own fixed drawing colors.

| Semantic token | Primitive / value | Implemented role |
| --- | --- | --- |
| `--bg` | `--navy-950`, `#0b101c` | Page background |
| `--surface` | `--navy-900`, `#101725` | Claim, leaderboard, dialogs |
| `--raised` | `--navy-850`, `#151e2e` | Cabinet, stat tiles |
| `--hover` | `--navy-800`, `#1b2738` | Neutral controls |
| `--border` | `--slate-600`, `#334258` | Structural outlines |
| `--muted` | `--slate-400`, `#9ba9bb` | Supporting text |
| `--text` | `--slate-100`, `#eaf0e7` | Main text |
| `--accent` | `--lime-400`, `#b4f46d` | Play, score, progress, brand |
| `--accent-hover`, `--focus` | `--lime-300`, `#c8ff92` | Primary hover and focus ring |
| `--on-accent` | `#14220c` | Play label |
| `--warning` | `--gold-300`, `#e6c582` | Practice badge and prize information |

There is one dark theme. Practice status includes words and a dot; sound includes an icon, ON/OFF text and a pressed state. The measured primary label/background contrast is 12.74:1; arcade control text is 10.02:1; supporting text on the leaderboard footer is 7.01:1. These are browser-computed solid pairs, not a claim about every pixel in the game. See the validation report for complete measured pairs and limits.

## Typography and spacing

`--sans` is `'Trebuchet MS', Arial, sans-serif`; `--mono` is `'Courier New', monospace`. Installed system fonts resolve the stacks. No font files or network requests are used. Body text is 15px/1.55; dialog text is 14px. The desktop brand heading uses `clamp(36px, 5.4vw, 60px)` with 1.1 line-height and -4px letter-spacing. Major card headings are 20–22px, the leaderboard heading is 16px mono, the scoreboard is 29px mono with tabular numbers. At the narrowest breakpoint the brand is 34px minimum and scoreboard numbers are 25px. Arcade micro-labels range from 6–11px; they are supplementary to the primary buttons, numeric score and Info instructions.

The page is at most 1080px wide. Desktop gutters are 32px; section gaps are 24px. The cabinet uses 12px padding and a 13px outer radius, 5px internal control radii and a dark lower shadow resembling a cabinet base. Side panels use 20px padding and 12px radii. The main action is a 45px-minimum lime button with a shallow 3px lower edge; arcade buttons are at least 50px tall on desktop, 48px on small screens.

## Components and behavior

- **Cabinet:** SCORE / BEST / LEVEL sit above the canvas. Ready, playing, paused and round-over states have distinct labels. Play and Play again start a fresh round; RESET preserves saved records. The level meter expresses progress to the next ten-point boundary.
- **Claim:** chest artwork, Day 1 preview and a native disabled button with a visible reason. No fake claim, countdown or token award.
- **Leaderboard:** semantic Rank / Name / Score / Level table, truthful empty state, exact prize terms and Not started status. No sample people or fabricated rankings.
- **Arcade controls:** real buttons for SHARE, RESET, INFO, STATS and sound; a real link to `https://imd.fun` for IMD. SHARE uses native sharing, clipboard, then selectable text as a fallback.
- **Dialogs:** native modal focus containment, visible close control, Escape dismissal and focus return. Name editing has a persistent label, a 20-character maximum, inline error and focus on the invalid field. Stats identify their device-only scope.
- **Focus and motion:** 3px focus outline with 4px offset; the canvas ring is inset. Reduced-motion disables scrolling animation and button transitions. Under no motion preference, controls use a 120ms color/press transition and 0.96 pressed scale. The ready scene is static. Playing motion is essential; pause is available.

## Responsive behavior

Above 950px, the cabinet shares a two-column grid with a 288px sidebar. At 950px and below, that sidebar is 250px with 18px gaps. At 760px and below, the claim panel moves above the cabinet in document order, becomes compact, and its decorative streak preview disappears. The field-guide sidebar is hidden; full rules remain in INFO. At 420px and below, the claim button takes a full row, cabinet padding drops to 8px and the scoreboard/arcade controls tighten. The leaderboard header and competition footer wrap. Forms retain 16px input text.

Chromium renders at 320, 390, 768 and 1280 CSS pixels were inspected; no horizontal overflow was found. The guide review, screenshots, fixes and unperformed checks are in `docs/validation.md`.

Design guidance: Jakub Krehel's Better Interface, pinned commit `267330e1adfc66a718fb65fa6918c1f06d0a689e` (MIT). Documentation method: Paul Bakaus's Impeccable, pinned commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8` (Apache-2.0). The adapted guide's license texts are retained in `docs/DESIGN_GUIDE_LICENSES.txt`.
