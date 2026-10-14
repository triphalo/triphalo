# Walking pose, copy and plain wordmark — verification

**PASS.** The child's viewer-right knee and lower leg now form a cleaner walking silhouette. The five approved paragraphs match the user's literal wording, the original opening/headlines/contact remain intact, and the wordmark is plain native **TripHalo** text with no gold dot or SVG. All requested checks are resolved.

## Results

- **6/6 homepage regression tests passed** in 31.4 seconds; no skips, failures or retries. Covers copy/contact boundaries, native keyboard navigation, motion/tuning, reduced motion, WebGL fallback and mobile/narrow layouts. [Raw Playwright results](home-tests.json).
- **20/20 focused production checks passed**, with zero browser exceptions, console errors or failed assets. Independently compares literal user-approved strings at 1440×1000, 390×844 and 320×740; verifies the plain wordmark, no horizontal overflow, Work scene captures, and all five paragraphs scrolling completely into a readable area at both mobile sizes. [Structured results](production-report.json) · [Reproducible focused script](verify-focused.mjs).
- **Final tall-window production smoke passed** after the desktop aspect-ratio framing correction. At 1132×1476, all three figures are fully visible, including the right parent's hand and foot. Rechecked exact copy, plain logo, no horizontal overflow, native Work/Contact navigation, visible mail link, animation advance, stable pause/resume and absence of browser/asset errors. [Final smoke results](production-tall-report.json).

The six-test suite and 20 focused checks ran before the final tall-window-only framing correction; their 1440/390/320 cases are unchanged by that correction. The rebuilt production preview then received the targeted tall-window capture and smoke above. No broader sweep was repeated.

## Mobile reading

All five complete paragraphs can be reached by ordinary scrolling at both 390px and 320px widths. Paragraphs were positioned around `y=122`, below the 82px fixed header. The longest paragraph ended at `y=295` on mobile and `y=324` on narrow, well above the controls at `y=781` / `677`. There is no text truncation or horizontal overflow. Screenshots were visually inspected, including the retained long Work paragraph.

- [Mobile Work, full retained paragraph](production-mobile-work-2-reading.png)
- [Narrow Work, full retained paragraph](production-narrow-work-2-reading.png)
- [Mobile Belief, middle paragraph](production-mobile-belief-2-reading.png)
- [Narrow Belief, middle paragraph](production-narrow-belief-2-reading.png)

Reading captures for every paragraph are included as `production-{mobile|narrow}-{belief|work}-{number}-reading.png`.

## Pose and framing evidence

- [Production desktop Work](production-desktop-work.png) · [Child at 6×](production-desktop-work-child-6x.png)
- [Production mobile Work](production-mobile-work.png) · [Child at 6×](production-mobile-work-child-6x.png)
- [Final tall-window Work](production-tall-work.png)
- [Before desktop child](before-desktop-work-child-6x.png) · [Before mobile child](before-mobile-work-child-6x.png) · [Before observations](before-observations.md)

`before-*` files preserve the original production pose. `after-*` files preserve the intermediate development review from port 4311. `production-*` screenshots come from the local production preview on port 4310. Child enlargements are nearest-neighbour crops of actual Playwright screenshots, without retouching or pose reconstruction.

Verification changed only evidence files. No source changes, deployment or domain changes were made by this QA task.
