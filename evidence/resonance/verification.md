# TripHalo — final local handoff

Verified 14 October 2026. Local production preview: <http://127.0.0.1:4310>.

## Result

- `npm run build`: PASS, all routes statically generated. Final production server restarted after build and asset completion.
- Focused homepage suite: 6/6 PASS, including actual Chrome with WebGL disabled. Final CSS adjustment only made the fixed header opaque behind the wordmark.
- Final standalone browser verifier against the restarted production build: 27/27 PASS. Zero browser exceptions, console errors or failed HTTP responses.
- Homepage, new social image, favicon and Apple icon: HTTP 200.
- Desktop: 1440 × 1000. Touch layouts: 390 × 844 and 320 × 740, with no horizontal overflow.
- All 12 supplied copy fragments and semantic headings verified; sole contact link is `mailto:hello@triphalo.com`.
- Real scrolling verified coalescence → passage → human experience. Pointer/keyboard/touch controls, pause/resume, reduced motion, no-JavaScript reading and contact access verified.
- Screenshots and recording frames inspected for art, readable text and mobile composition.

## Deliverables

- `triphalo-interactions.mp4`: real browser interaction recording, 34.76 seconds, 1440 × 1000 H.264.
- `triphalo-interactions.webm`: original browser recording.
- `report.json` and `report.md`: individual results from the final frozen-build run.
- `recording-contact-sheet.jpg`: six sampled frames of the recording.
- `source-hashes.json`: SHA-256 fingerprints of the final page, renderer, copy and key assets.
- Desktop/mobile/narrow screenshots in this folder.

## Scope

Chrome was used for browser verification; phone dimensions and touch were emulated. Physical-device performance and other browser engines were not measured. The email link was verified without sending email.

Local build only. No remote push, deployment, domain or DNS change. Previous local studies remain separate from the current homepage. The retained local production process runs `npm run start -- --port 4310` from the `studio` directory.
