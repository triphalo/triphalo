# TripHalo studio

An independent technology and experience studio. A statically rendered Next.js one-page website with an original, live Three.js aperture and one enquiry route: `hello@triphalo.com`.

## Local development

Use Node 22 and npm. The committed lockfile is authoritative.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. For the production preview:

```sh
npm run build
npm run start
```

There are no required environment variables, external content services, forms, analytics or application backend. Fonts and production artwork are local. Font licences are included in `public/fonts/`.

## Verification

```sh
npm run typecheck
npm run lint
PLAYWRIGHT_CHANNEL=chrome npm test
```

Tests expect the production server at `http://127.0.0.1:3000` (or `PLAYWRIGHT_BASE_URL`). Installed Google Chrome can be used as above; otherwise install Playwright Chromium with `npx playwright install chromium` and omit the channel variable. See `evidence/verification.md` for actual results and limits. The tests include narrow touch layouts, no JavaScript, reduced motion, graphics failure, motion controls and asset/metadata checks.

## Design and maintenance

- `app/page.tsx`: all readable copy, semantic headings, page composition and contact links, rendered on the server.
- `app/layout.tsx`: locally served fonts, title, description, canonical and social metadata.
- `app/globals.css`: responsive composition, design tokens and focus/motion treatments.
- `components/halo-scene.tsx`: progressive enhancement, motion preference, pause control and failure fallback.
- `components/halo-engine.ts`: custom swept geometry, materials, lighting and finite scroll/pointer animation.
- `public/halo-poster.webp` and its mobile variant: rendered views of the actual instrument, shown before graphics load and in static/failure modes.
- `public/og-triphalo.jpg`: 1200 × 630 social artwork.
- `public/studio-environment.bin.gz`: precomputed HDR studio reflections.
- `scripts/bake-environment.mjs`: reproduce the local lighting asset without external imagery.
- `scripts/capture-artwork.mjs`: rebuild poster and social image from the running local production preview. Requires installed Google Chrome.
- `scripts/capture-review.mjs`: desktop/mobile evidence and signature-motion recording. Install the isolated encoder once with `npx playwright install ffmpeg`.

The aperture is true 3D, not a rotating image. Its asymmetrical ceramic profile surrounds a bronze reveal and amber light well. Native scrolling drives a roughly 25-degree alignment and a gradual increase in warmth. Pointer movement adds a restrained tilt. Rendering stops after settling, outside the viewport, while paused, or when the document is hidden. Reduced-motion preference avoids loading the 3D engine. Mobile uses a separate in-flow composition. Core text and email work without JavaScript or WebGL.

## Migration scope

Base: `triphalo/triphalo`, `master`, commit `764ff359bfdd14b946f8cbbe8611c11c82adf25b`.

This feature branch replaces the Gatsby 4 / React 17 / Netlify CMS coffee-shop starter: its pages, blog, CMS/admin, images, Gatsby plugins, Netlify function/configuration and obsolete dependency tree. Repository history is preserved. The earlier local Vite experiment at `../website` is untouched. No connection between the old repository and the current Framer deployment is assumed.

## Deployment and release boundary

The intended canonical remains `https://www.triphalo.com`, matching the current apex-to-www redirect. **No production release or domain cutover is authorised by this branch.** Current Framer production, DNS and mail must remain intact during review.

Read `evidence/deployment-discovery.md` before publication. Discovery found the existing Pro team but no TripHalo Vercel project. Vercel labels the first deployment of a new project Production even when preview is requested; this is the remaining authority gate. A legacy Netlify GitHub webhook also subscribes to branch pushes and pull requests, so no remote push or PR has been made.

After explicit approval of the isolated Vercel bootstrap, create a `triphalo` project in the confirmed team and stage it without custom domains using the documented `--prod --skip-domain` flow; then upload this feature branch as a Preview and verify its environment and protection. Do not attach production domains or connect Git automatically during this preparation. Use an empty, non-sensitive bootstrap so the reviewed redesign remains a Preview deployment. Current team ID and commands are in the discovery report.

After the owner approves the final preview for release:

1. Resolve the legacy Netlify webhook’s destination and branch behaviour before pushing or enabling a Git integration. Keep `master` as the production branch.
2. Produce a staged production build of the approved source, without assigning domains; verify it again because production promotion may rebuild a preview.
3. Add both `www.triphalo.com` and `triphalo.com` to the confirmed project; configure apex → www. Obtain the project-specific DNS instructions from Vercel rather than guessing record targets.
4. Change only the required web A/CNAME records. Preserve current nameservers and every MX/TXT/DKIM/DMARC mail record.
5. Verify HTTPS, both domain routes, canonical, assets, social image and mailto on the public site. Retain the prior Framer web records for rollback.

The single mailto link uses the visitor’s configured mail client. Delivery of an email is not part of site verification.
