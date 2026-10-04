# FLOPPY PEPE publication-status design

## Overview

This document describes the implemented **status page only**. The original game is inaccessible, so its colors, dimensions, artwork, fonts, animations, sounds and responsive layout cannot be documented or reproduced yet. The neutral page communicates the missing source and deployment connections without simulating gameplay or an active competition.

Source of truth: `src/styles.css` for tokens/layout and `src/main.tsx` for structure and copy. The page uses one reading column, clear text status, two sections and a native disclosure. These choices are not a replacement visual identity for FLOPPY PEPE.

## Colors

All tokens are in `src/styles.css:8`.

| Token | Value | Role |
| --- | --- | --- |
| `--page` | `#f7f7f7` | Page background |
| `--surface` | `#ffffff` | Disclosure background |
| `--text` | `#202020` | Main copy and headings |
| `--text-secondary` | `#555555` | Supporting copy and unset values |
| `--border` | `#767676` | Disclosure boundary |
| `--link` | `#184e91` | Reference link |
| `--link-hover` | `#103563` | Link hover/active |
| `--focus` | `#184e91` | Keyboard outline |

This page implements a single light scheme. Measured computed-style pairs: body/page 15.21:1; secondary/page 6.96:1; link/page 7.73:1; body/surface 16.29:1; focus/page 7.73:1; focus/surface 8.28:1. Full measured states are recorded in `artifacts/browser-check.json`; hover/active contrasts were not separately measured. No original-game contrast claim is made.

## Typography

System font stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. No downloaded font assets. Browser and platform choose the actual system face.

- `--text-body`: `1rem`, normal weight 400, line-height 1.6.
- `--text-small`: `0.875rem`, supporting copy/footer.
- `--text-section`: `1.25rem`, bold native h2 weight, line-height 1.4.
- `--text-title`: `clamp(1.75rem, 5vw, 2.5rem)`, bold native h1 weight, line-height 1.2, letter spacing `-0.025em`.
- Links, summary, definition labels and reward copy use weight 600; status uses 700.

Headings balance wrapping; prose has a maximum measure of 65ch. Text remains selectable. Long content can wrap anywhere instead of clipping. Screenshots confirm wrapping at 320 and 1280 pixels; automated reflow also covers 390 and 768.

## Layout

Spacing tokens: `--space-sm: 0.5rem`, `--space-md: 1rem`, `--space-lg: 1.5rem`, `--space-xl: 3rem`. Main content has `max-inline-size: 48rem`, centered margins and fluid block padding `clamp(1.5rem, 5vw, 4rem)`.

Sections have 3rem separation. Main inline padding is 1.5rem, reduced to 1rem at `max-width: 30rem`; both safe-area insets participate in its minimum. The definition list has two equal columns above that breakpoint and stacked labels/values below it. No fixed-height text containers, absolute positioning, sticky content or routes are used.

At 320, 390, 768 and 1280px, collapsed and expanded states fit without horizontal overflow, also with the root text size enlarged to 200%. Text enlargement is not native browser zoom. RTL and physical safe-area behavior were not tested.

## Elevation & Depth

Flat page. The disclosure uses a white surface and a 1px structural border, without shadows or overlays.

## Shapes

Disclosure radius: 0.5rem. Focus outline: 3px solid `--focus`, offset 4px, radius 2px. Focus uses the system `Highlight` color in forced-colors mode. Expanded content starts with 0.5rem top padding so its text clears the focus outline.

## Components

`App` in `src/main.tsx:5` is a single page component with no public props or variants:

- Header: publication label, h1 and explicit blocked status.
- Source section: access explanation, request for original files, and `.reference-link`, a native anchor with a minimum 2.75rem height and descriptive text. It navigates in the same tab and retains native link behavior.
- Competition section: unset dates/publication state in a definition list; native `details`/`summary` for required setup. Enter, Space, click and touch toggle it. No custom focus management is needed.
- Footer: persistent statement that the original game has not been recreated or published.
- `index.html` includes a text-only `noscript` blocker notice.

There are no forms, score submissions, claims, loading states, sounds, animations or live success states. There is no browser-storage replacement for shared records. Reduced-motion mode is inherently static. Hover underlining is gated by `hover: hover`; `:focus-visible` provides keyboard outlines. The original arcade controls must be restored from the original source when available.

## Do's and Don'ts

Keep blocker copy accurate, native disclosure semantics and clear reference-link labeling. Additional status content should reuse section headings, spacing tokens and the existing reading column. Preserve source-backed measurements in this document after changes.

Do not treat these neutral tokens as the game's design. Do not draw replacement Pepe/RAM/chest assets, invent scores or launch dates, or report publication success without an actual deployment. The original small green Pepe in a blue shirt, arcade proportions, artwork, sound and controls remain requirements to recover from the original source.
