# FLOPPY PEPE — publication blocked

The missing `dist/index.html` has been repaired with a buildable React **publication-status page**. The export explicitly says that the game and competition are unavailable. This is useful partial delivery, not the requested playable game or a completed publication.

The [original reference](https://floppy-pepe.bikemcanerkoc.chatgpt.site/) returned **HTTP 401 Unauthorized**, with “Log in to access”, when checked with curl. Python's HTTP client received 403. No original game source, Pepe/RAM/treasure-chest images or sounds were supplied. Please provide the original source files or an accessible repository containing those assets and access to the reference for appearance comparison. No approximate game has been created.

No backend or IPFS publishing connection is available in the exposed tools or supplied project. Please provide the intended persistent backend project and publishing service through the deployment environment. Private credentials must stay server-side. The published IPFS/eth.limo URL and original source repository URL are **unavailable**; no CID or deployment has been created.

## Delivered files

- `src/main.tsx`, `src/styles.css`: status-page source, not recovered game source.
- `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`: pinned React/Vite/TypeScript build.
- `dist/index.html` and `dist/assets/`: complete production status-page export with relative asset URLs.
- `scripts/check-export.mjs`, `scripts/check-browser.mjs`: reproducible checks scoped to this export.
- [DESIGN.md](DESIGN.md): actual status-page design; original game design remains unknown.
- [Validation](artifacts/validation.md), [browser results](artifacts/browser-check.json), and [access evidence](artifacts/reference-access.json): actual checks and limitations.

## Install, preview and rebuild

Requires Node 22.12 or newer. To respect this assignment's protected `node_modules/` paths, install into a temporary copy rather than the submission tree. From the repository root:

```sh
build_dir="$(mktemp -d /tmp/floppy-pepe-build.XXXXXX)"
cp package.json package-lock.json tsconfig.json vite.config.ts index.html "$build_dir/"
cp -R src scripts public "$build_dir/"
npm --prefix "$build_dir" ci --cache /tmp/floppy-pepe-npm-cache
npm --prefix "$build_dir" run typecheck
npm --prefix "$build_dir" run build
npm --prefix "$build_dir" run check:export
npm --prefix "$build_dir" run preview
```

Open the local URL printed by Vite. Stop preview with Ctrl+C. `npm --prefix "$build_dir" run dev` runs the development server instead. After a successful rebuild, replace the repository's generated `dist/` directory with the complete `$build_dir/dist/` directory; retain source and lockfile. Do not submit the temporary copy, dependencies, npm cache or browser downloads.

For browser validation, install Chromium using the temporary copy's Playwright binary, then run the bounded verification script:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/floppy-pepe-playwright-browsers \
  "$build_dir/node_modules/.bin/playwright" install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/floppy-pepe-playwright-browsers \
  npm --prefix "$build_dir" run check:browser
```

The script serves that copy's finished `dist/` under `/preview/`, closes its browser and server on completion, and writes results/screenshots to that copy's `artifacts/`. Linux may need Chromium system libraries; they were available during this run. Neither browser downloads nor dependencies belong in Git. No ignore file was changed.

## Actual verification

`npm ci`, `npm run typecheck`, `npm run build`, `npm run check:export` and `npm run check:browser` passed in the isolated build copy. Its source, lockfile and final export were compared byte for byte with this repository. Export size: **229,002 bytes**.

Chromium checked the production export at 320, 390, 768 and 1280 pixels: native disclosure by keyboard/click/touch, focus styling, correct reference-link destination, exact reward copy, 200% text enlargement, no horizontal overflow, no runtime/resource errors, and zero axe violations in the expanded state. Screenshots at 320 and 1280 were inspected; a focus-spacing defect was fixed and rechecked. These are status-page checks, not gameplay tests. Native browser zoom, screen readers, physical devices and original-game comparison remain unverified.

## Competition launch time

**No launch setting is implemented yet.** An operational configuration command cannot be supplied without the original game and a connected backend. Do not put a launch date in the static frontend as the authoritative competition clock.

When the backend is available, configure a fresh launch instant as an explicit UTC timestamp. Derive the end as `launch + 864000000` milliseconds (exactly ten days). The server must expose both dates, accept competition scores only inside that window, freeze the final ranking at the end and permit practice afterward without ranking changes. Verify before launch, at launch, immediately before the end, exactly at the end and afterward. Never reuse earlier test dates.

The required reward statement is preserved in the status-page disclosure:

> The competition lasts 10 days. The player ranked #1 at the end will receive 5 IMD. The reward will be sent manually by the organizer after the competition ends.

This is one total prize, paid manually. Daily claims do not transfer IMD or increase scores. No token, fee, wallet, contract or automatic payout has been added.

## Finish and publish

1. Obtain and reuse the original game implementation and original assets; preserve its appearance, animations, sounds, arcade controls and responsive behavior.
2. Connect a real persistent backend with stable player identity, server-side deterministic input replay, highest verified score ranking, earliest-achievement tie breaking, UTC daily claims and the ten-day cutoff. RESET must preserve records. Show actual loading/saving errors and refresh rankings after acceptance and periodically.
3. Configure a new launch time on that backend, expose only its public API address to the frontend, and complete the outstanding game/backend tests in the validation report.
4. Rebuild with `base: './'` and publish the **complete** `dist/` through the selected IPFS pinning service. Confirm persistent pinning, open the returned CID through a gateway subpath, and verify the game and shared records there. If ENS hosting is wanted, configure the selected name's IPFS content hash through its owner, then check the resulting eth.limo URL.
5. Report only the actual returned IPFS/eth.limo URL and actual accessible source repository URL. No service-specific publishing command is available until a service is supplied.

The current export must not be announced as a live competition. No `.git/` operations or commits were performed because the assignment prohibits touching that path. The deliverable files are present for the submission system to collect; actual Git bundle generation remains outside this worker's permitted actions.
