# TripHalo — typography and control refinement

The approved neural-halo / shared-human-landscape design is saved in local commit `7d77204`. Its renderer and landscape source are unchanged in this refinement.

Compare the proposals at <http://127.0.0.1:4310/type-study>. The current pairing is also available for reference. Choosing a direction changes only the comparison page, keeps the same canvas, and retains the reading position (font metrics can cause normal browser scroll anchoring within one line).

| Direction | Headline and wordmark | Body and details |
| --- | --- | --- |
| Precision | Mona Sans, slightly condensed | Mona Sans body; IBM Plex Mono labels |
| Humanist | Bricolage Grotesque | Source Sans 3 |
| Editorial | Newsreader roman headline; IBM Plex Sans wordmark | IBM Plex Sans |

Each proposed wordmark uses a drawn circular halo as its final `o`, aligned to the neighbouring letters. The comparison does not select a new homepage typeface. All supplied website wording remains intact. Font files and their original OFL licences are local; exact provenance and variable axes are recorded in `public/fonts/type-study/SOURCES.md`.

The homepage and proposals now omit the spectrum slider. Direct halo dragging still changes the light, with left/right arrows available when the halo is keyboard focused. A small `Motion on/off` text control replaces the playback icon. System reduced motion and explicit pause remain supported.

The comparison panel can be minimised and reopened. Keyboard focus stays within its controls when toggled. Direct `?look=precision`, `?look=humanist`, `?look=editorial` and `?look=baseline` links are supported. Missing or invalid values return to Precision.

## Verification

- Production build passes, including the new static comparison route.
- Homepage browser results: 26/26 passed, in `evidence/type-study-home/report.md`.
- Typography, fonts, desktop/mobile and keyboard results: 42 accepted checks and zero unresolved findings, in `evidence/type-study/report.md`. Initial findings are retained separately; the final targeted follow-up passes all 23 checks.
- Visual comparison: `evidence/type-study/font-comparison.jpg`.
- Original baseline evidence remains in `evidence/resonance/`.

All work remains local. No source push, deployment, production-domain or DNS change.
