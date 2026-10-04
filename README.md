# FLOPPY PEPE

A playable React / TypeScript browser arcade, built from scratch with original pixel artwork. Tap, click or press Space to hop through green and gold RAM. The complete static export is in `dist/`, alongside source and the existing dependency lockfile.

**Mode: practice. Competition not operational. Public playable URL: not created in this run.** Publishing the completed site was attempted using the available Cloudflare credentials. Both the static-assets upload and direct Worker upload returned HTTP 403, “No access to the specified resource.” No IPFS pinning or ENS publishing connector was available. See [publication evidence](docs/evidence/publication.json) and [static-assets attempt](docs/evidence/publication-static-assets.json). A successful local preview is not a public deployment.

## Play and features

- Tap/click the canvas, Space or ↑ to hop. Ceiling, floor and RAM collisions end the round.
- Green RAM: +1; occasional gold RAM: +3. Every 10 points adds a level. Speed increases and gaps narrow; newly generated gaps move vertically from level 3.
- Play / Play again, pause/resume, sound, SHARE, RESET, IMD, INFO and STATS work. Escape, leaving the tab or losing window focus pauses a round. RESET affects only the current round.
- Device-saved stable practice identity, editable nickname, best score, rounds played, top level and gold RAM count. Storage failure leaves the game playable with an explanatory message. These records are not shared or verified.
- Daily Claim is disabled. The leaderboard has a truthful empty state, exact prize terms and no launch timer. No login, wallet, payment, token or automated payout is included.

## Install, preview and rebuild

Node 22.12+ is required. The existing `package.json`, lockfile, TypeScript and Vite configuration are unchanged. Its internal package name still says `publication-status` because those dependencies/manifests are protected; no such branding appears in the game.

Install into a temporary build copy to keep all dependencies and caches outside this repository:

```sh
build_dir="$(mktemp -d /tmp/floppy-pepe-build.XXXXXX)"
cp package.json package-lock.json tsconfig.json vite.config.ts index.html "$build_dir/"
cp -R src public scripts "$build_dir/"
npm --prefix "$build_dir" ci --cache /tmp/floppy-pepe-npm-cache
npm --prefix "$build_dir" run typecheck
npm --prefix "$build_dir" run build
npm --prefix "$build_dir" run check:export
npm --prefix "$build_dir" run preview
```

Open the preview URL printed by Vite; Ctrl+C stops it. For development, run `npm --prefix "$build_dir" run dev`. No server is needed by the exported frontend. After rebuilding, replace the repository's `dist/` with the **complete** temporary `dist/`, removing stale hashed assets. Vite's existing `base: './'` keeps asset URLs relative for IPFS gateway subpaths. No runtime remote fonts or artwork are required.

## Reproduce validation

```sh
node --experimental-strip-types "$build_dir/scripts/check-game.mjs"
PLAYWRIGHT_BROWSERS_PATH=/tmp/floppy-pepe-playwright-browsers \
  "$build_dir/node_modules/.bin/playwright" install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/floppy-pepe-playwright-browsers \
  npm --prefix "$build_dir" run check:browser
```

The browser script owns a temporary foreground HTTP server at `/preview/`, closes it and Chromium when finished, and writes evidence into the build copy's `artifacts/`. Keep browser downloads, dependencies and caches outside Git. The repository's existing Git exclude ignores `artifacts/`; final evidence is copied to `docs/evidence/` instead, without editing any ignore file.

Actual final checks passed: install (0 reported vulnerabilities), typecheck, production build, export inspection, nine engine behavior checks and Chromium interaction validation at 320, 390, 768 and 1280 pixels. Browser play driven by observations of the rendered canvas reached **23 points / level 3** without game-state injection. It checked collisions, score persistence, play/replay/reset, sound generation/muting, nickname errors/persistence, modal dismissal/focus return, sharing/fallback, touch input and Space without scrolling. Automated accessibility scans found zero violations in the final ready and Info states. No browser console or resource errors were recorded. [Full evidence and limitations](docs/validation.md); [implemented design](DESIGN.md).

## Publish the finished export

The submission publisher must include `dist/index.html`, all of `dist/assets/`, `dist/pepe.svg`, `dist/chest.svg` and the notices. The source and existing lockfile remain in the repository. Git index/commits are left to the submission system because this assignment prohibits modifying `.git/`.

A credentialed Cloudflare deployment can use the included script from the repository root:

```sh
node scripts/publish.mjs --dry-run
node scripts/publish.mjs
```

Supply `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` through the deployment environment, **not** an exported file. The account-scoped token must permit Workers Scripts Edit / static asset upload and workers.dev route management. The script uses the game-based name `floppy-pepe`, uploads only `dist/`, enables its public workers.dev route, and prints the actual URL after anonymous HTML verification. `--inline` is an alternate normal Worker upload for accounts without the static-assets API; it was also denied here. This publishing code is supplied but a successful deployment is unverified.

The API flow follows [Cloudflare's direct-upload documentation](https://developers.cloudflare.com/workers/static-assets/direct-upload/). To validate a successful deployment, run the same browser script with `PUBLIC_GAME_URL` set to the returned URL. Do not report a guessed workers.dev hostname as live.

For the existing IdentityMD/IPFS workflow, publish the entire `dist/` directory through its pinning service, retain the resulting directory CID, and update the hosting record with its authorized publisher. Then run browser validation against the actual public gateway URL. No pinning credential, publishing tool or authority to update that hosting record was exposed in this run. This work did not modify the earlier hosted version.

## What is needed for a real competition

This export intentionally has no submission endpoint, backend, fake API or client-side launch switch. Enabling a date in JavaScript would not make prize records authoritative.

A concrete deployment option is a Cloudflare Worker API plus a D1 database. Required access: an account-scoped token with **Workers Scripts Edit and D1 Edit**, a D1 database ID/binding, and a public HTTPS API origin allowing the frontend origin. D1 access returned HTTP 401; Durable Objects access returned HTTP 403. Equivalent access to another transactional persistent backend would also work. Private deployment/database credentials must remain server-side.

Backend implementation and frontend integration remain required. The service must persist an anonymous identity with an unguessable proof of ownership, nickname, server-issued seeded round, bounded input trace and verified result. Reuse the deterministic `src/engine.ts` simulation server-side, but do not accept client score numbers. Bind each nonce to its player, limit replay length/rate, reject reused/expired rounds, verify elapsed time and collision, and record verified achievements transactionally. An identity stored only in browser storage is neither cross-device recovery nor proof of one unique human; abuse controls need separate design.

Only after shared score recording is tested should the backend expose a public UTC `launchAt`. Derive `endAt = launchAt + 864000000` milliseconds. Accept verified competition submissions only while `launchAt <= serverNow < endAt`; freeze highest scores and tie-break equal scores by earliest verified achievement. Keep practice available after the cutoff. Refresh shared ranks after successful submissions and periodically. No competition dates are configured by this delivery.

Claims require an atomic unique `(playerId, UTC-date)` record. A first claim is Day 1; yesterday's claim continues the streak; any missed day resets the next claim to Day 1. A claim grants no IMD and no game-score bonus. Before launch, test multiple browsers, concurrent/duplicate claims, replay rejection, ties, round submissions around the exact cutoff and frozen ranks afterward. These backend tests could not run here.

The competition lasts 10 days. The player ranked #1 at the end will receive 5 IMD. The reward will be sent manually by the organizer after the competition ends.

This is one total prize, and the competition is **not operational** in the current export.
