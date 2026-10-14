# TripHalo — light, intelligence, experience

A local one-page website for the independent technology and experience studio. A procedural network of light gathers into a circular halo; scrolling passes through it into an abstract landscape of people together. All supplied copy is retained verbatim, with `mailto:hello@triphalo.com` as the only contact route.

## Run locally

Use Node 22 and npm. No environment variables or external services are required. Fonts and artwork are local.

```sh
npm ci
npm run dev -- --port 4310
```

Open <http://127.0.0.1:4310>.

Typography options are at <http://127.0.0.1:4310/type-study>. Switch between Precision (Mona Sans / IBM Plex Mono), Humanist (Bricolage Grotesque / Source Sans 3), Editorial (Newsreader / IBM Plex Sans) and the current pairing. The comparison preserves the artwork and scroll position; its review panel can be minimised. These are proposals, not a selected replacement for the homepage typography. Local font licences and provenance are in `public/fonts/type-study/`.

The approved neural-halo and human-landscape baseline is preserved in local commit `7d77204`. Later typography and control refinements are separate from that checkpoint.

For the production build and local preview:

```sh
npm run build
npm run start -- --port 4310
```

Only one server can use that port at a time. The current handoff uses the production server.

## Verify and record

```sh
npm run typecheck
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4310 PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/home.spec.ts
RESONANCE_URL=http://127.0.0.1:4310 npm run verify:resonance
```

The verifier checks the locked words, navigation, desktop and mobile layouts, keyboard and touch controls, animated and paused frames, reduced motion, no-JavaScript content and browser errors. It also records real browser interactions and converts the recording to MP4 using locally installed `ffmpeg`. Pass `-- --no-record` to omit recording. Evidence is written to `evidence/resonance/`.

Installed Google Chrome is the default browser for the standalone verifier. The focused Playwright suite includes a WebGL-disabled fallback test. Earlier study tests are retained separately.

## Source map

- `app/page.tsx` and `components/resonance-copy.tsx`: server-rendered copy and semantic page structure, shared with the typography comparison.
- `app/type-study/` and `components/typography-study.tsx`: local typography and halo-wordmark proposals.
- `app/resonance.css`: current composition, local typography and responsive layouts.
- `components/resonance-experience.tsx`: native section navigation, pointer/touch input, keyboard-accessible controls, pause and reduced-motion handling.
- `components/resonance-engine.ts`: procedural neural halo, incoming light, perspective passage and scene transitions.
- `components/human-landscape.ts`: procedural light-particle figures, terrain and horizon.
- `lib/locked-copy.ts`: approved wording.
- `app/layout.tsx`: local fonts and metadata.

The artwork responds without explanatory overlays. Drag the halo to change its warmth, or focus it and use the left/right arrow keys. There is no separate spectrum slider. A discreet “Motion on/off” text control replaces the playback icon and freezes continuous motion. System reduced-motion preferences start the artwork still. Explicitly resuming opts into movement. Native page scrolling and anchors remain available in either state. Rendering suspends in hidden documents. Core content and contact remain available without JavaScript or WebGL.

No analytics, forms, chatbot, booking service, remote font requests or backend are included.

## Scope and retained work

This direction replaces the homepage at `/`. Earlier studies remain at `/study` and `/studies/sculpture`, along with their source, assets and tests. The separate `../website` experiment is untouched. Previous project and deployment notes are preserved in `docs/previous-build-notes.md`.

This is a local build. No source push, deployment, production-domain or DNS change has been performed. Production publication and domain changes require separate approval.
