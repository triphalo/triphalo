# TripHalo review build — verification

14 October 2026. Local production preview: http://127.0.0.1:3000. Repository: `triphalo/triphalo`; branch: `feat/studio-aperture`. The delivered commit is recorded in the handoff and repository history.

## Result

The replacement one-page site is locally built and exercised. Content is statically rendered by Next.js 16.4 / React 19.3, with a separately loaded Three.js 0.186 scene. The enquiry route is `mailto:hello@triphalo.com`.

No Vercel deployment or Git push has been made. The current Framer production site, DNS and mail records remain unchanged. The precise remaining deployment decision is in [deployment-discovery.md](deployment-discovery.md).

## Build and code

- `npm run build`: passed; homepage, not-found, robots and sitemap are statically generated.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `npm audit --omit=dev`: zero vulnerabilities.
- Full dependency audit: five high-severity development-only entries share the same `braces` stack-exhaustion advisory through Next's ESLint/glob tooling. npm suggests downgrading the Next ESLint config to 14.2.35; that incompatible downgrade was not applied. This is not part of the browser/runtime dependency graph. See [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

## Browser exercise

Automated Chromium checks use installed Chrome 155 and software WebGL (ANGLE SwiftShader). Manual visual inspection used the Codex in-app browser. The suite covers:

- Desktop, tablet, 390px mobile and 320px narrow mobile: readable hierarchy, correct contact, no horizontal overflow.
- One h1, semantic content, canonical, title/description, local favicon, social image and resolving assets.
- No public excluded identities, extra contact channels or forms.
- Clean runtime console and no uncaught errors in the normal path.
- Keyboard skip link, visible focus and pause/resume.
- Reduced-motion static presentation, live preference changes and no-JavaScript copy/contact.
- WebGL initialisation failure, context loss, failed local lighting asset and a preference change during pending scene preparation.
- Finite rendering settles at idle, stops offscreen and obeys a simulated hidden-document event.
- Throttled mobile native touch scrolling and contact access.

**17/17 automated scenarios passed in 38.0 seconds.** See [browser summary](browser-tests-summary.json). The separate throttled touch-mobile run used 390 × 844, DPR 3, 4× CPU, 1.6Mbps down / 0.75Mbps up and 150ms latency: FCP 644ms, DOMContentLoaded 447.1ms and load 1,551.2ms. Content, live scene, native swipe and contact all passed. See [mobile measurements](mobile-throttle.json). Real tab-background behaviour is implemented and tested with a simulated visibility event; isolated automated Chrome did not expose real tab visibility switching, so a true background-tab test remains unverified. Physical-device FPS, Safari/Firefox, field Core Web Vitals, INP and hosted Vercel performance are not measured.

## Performance

Final Lighthouse mobile navigation on the local production build, run without concurrent browser tests:

| Category | Score |
| --- | ---: |
| Performance | 98 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

| Metric | Measured |
| --- | ---: |
| First contentful paint | 0.8 s |
| Largest contentful paint | 2.3 s |
| Total blocking time | 50 ms |
| Cumulative layout shift | 0 |
| Speed index | 1.0 s |

Conditions: Lighthouse 13, headless Chrome 155, mobile emulation, simulated 4× CPU slowdown and 150ms RTT / 1.6Mbps connection. These are lab diagnostics against localhost, not field claims. [Machine-readable result](lighthouse-summary.json). The full local HTML/JSON reports are retained under `evidence/lighthouse-mobile-final.report.*` and ignored by Git.

The initial diagnostic scored 55 with heavy scene lighting preparation (and a concurrent test run); it prompted replacement of runtime PMREM work with a precomputed 113KB local HDR asset and asynchronous shader compilation. The final measurement above is serial. The lower initial result is not presented as a controlled comparison.

## Visual and motion evidence

The final captures are in `evidence/captures/`: desktop opening/full page, tablet, 390px and 320px mobile, and reduced motion. `evidence/triphalo-interaction.webm` records pointer response and the native-scroll alignment/light sequence. The video and full automated HTML report are retained locally, not published as website assets.

The visual is live 3D: a custom swept ceramic profile, bronze inner reveal and warm light well, with a roughly 25-degree scroll alignment. It is not a plain torus or a still-image animation. The posters and social image are rendered from this same instrument. Native scrolling and all core copy are independent of graphics.
