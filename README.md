# TripHalo

The approved one-page website for TripHalo, an independent technology and experience studio. A procedural neural halo opens onto a shared human landscape. The site uses the selected Mona Sans / IBM Plex Mono typography, a plain TripHalo wordmark and the approved copy in `lib/locked-copy.ts`. Email is the sole contact route.

The canonical production address is **https://www.triphalo.com**. Metadata, robots and sitemap use that address. The apex domain should redirect to `www`.

## Local development

Use Node 22 and the committed npm lockfile. No environment variables or external services are required; fonts and artwork are local.

```sh
npm ci
npm run dev -- --port 4310
```

Open <http://127.0.0.1:4310>. For a production build, stop the development server and run:

```sh
npm run build
npm run start -- --port 4310
```

## Verification

With the local production server running:

```sh
npm run typecheck
npm run lint
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4310 PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/home.spec.ts
RESONANCE_URL=http://127.0.0.1:4310 npm run verify:resonance
```

The checks cover approved copy, navigation, desktop/mobile layouts, keyboard and touch interaction, pause, reduced motion, static fallbacks and browser errors. The verifier writes evidence to `evidence/resonance/` and records real interactions; local `ffmpeg` converts the recording to MP4. Add `-- --no-record` to omit recording.

## Release

Review the release branch in a pull request, run the production build and browser checks, then deploy the reviewed revision through the linked Vercel project. Verify the actual deployment and public `www` homepage, canonical metadata, contact link, static assets and apex redirect after publication. A successful build alone does not confirm the public release.

`.vercelignore` excludes local evidence, tests, reports, documentation and authoring scripts from the deployment upload. Required application source, public fonts, licences, icons and the current social image remain included. Dependency versions, the lockfile and the Vercel project association are managed separately from the website artwork.

## Source and retained history

- `app/page.tsx`, `components/resonance-copy.tsx` and `lib/locked-copy.ts`: page structure and approved wording.
- `app/resonance.css`, `app/typography.css` and `app/wordmark.css`: layout and typography.
- `components/resonance-experience.tsx`: navigation, direct interaction and motion preferences.
- `components/resonance-engine.ts` and `components/human-landscape.ts`: procedural artwork.
- `app/layout.tsx`, `app/robots.ts` and `app/sitemap.ts`: site metadata.

The release exposes the approved homepage; `/study` and `/type-study` entrypoints are removed. The original studio checkout and Git history preserve those experiments. Historical components and notes remain for reference, and the old study test is archived under `tests/archive/`. Unused prototype posters, environment data and study imagery are omitted from this release.

Drag the halo or use its left/right arrow keys to tune the light. The discreet Motion on/off control pauses continuous movement; reduced-motion preferences start the scene still. Content and email remain available without JavaScript or WebGL. The website has no analytics, forms, booking service, chatbot or backend.
