# TripHalo — typography and control refinement

> Historical local comparison record. Precision is the selected homepage direction. The release omits `/study` and `/type-study`; their original working versions remain in the studio checkout and Git history. References to local comparison routes and earlier verification below describe that retained history.

The approved neural-halo / shared-human-landscape baseline is saved in local commit `7d77204`.

Precision has been selected and applied to the homepage at <http://127.0.0.1:4310/>. Compare the alternatives at <http://127.0.0.1:4310/type-study>. The original pairing is also available for reference. Choosing a direction changes only the comparison page, keeps the same canvas, and retains the reading position (font metrics can cause normal browser scroll anchoring within one line).

| Direction | Headline and wordmark | Body and details |
| --- | --- | --- |
| Precision | Mona Sans, slightly condensed | Mona Sans body; IBM Plex Mono labels |
| Humanist | Bricolage Grotesque | Source Sans 3 |
| Editorial | Newsreader roman headline; IBM Plex Sans wordmark | IBM Plex Sans |

The selected Precision wordmark is plain `TripHalo` in Mona Sans, preserving its selected weight and spacing without a dot or altered letter treatment. The other alternatives retain their earlier drawn halo treatments for comparison. Homepage and comparison share the Precision typography rules and wordmark component. Two approved wording refinements are now applied: the final Belief paragraph and first Work paragraph. The first two Belief paragraphs, second Work paragraph and all other approved words remain unchanged. The original proposal is preserved with its partial approval status in `docs/copy-proposal.md`. Font files and their original OFL licences are local; exact provenance and variable axes are recorded in `public/fonts/type-study/SOURCES.md`.

The homepage and proposals now omit the spectrum slider. Direct halo dragging still changes the light, with left/right arrows available when the halo is keyboard focused. A small `Motion on/off` text control replaces the playback icon. System reduced motion and explicit pause remain supported.

The comparison panel can be minimised and reopened. Keyboard focus stays within its controls when toggled. Direct `?look=precision`, `?look=humanist`, `?look=editorial` and `?look=baseline` links are supported. Missing or invalid values return to Precision.

## Copy and walking-pose refinement

The five Belief/Work paragraphs match the user's latest approved wording exactly. The layout retains the longer passages in normal document flow. The child's viewer-right knee and foot now extend into a forward step; the other leg, parents and joined hands are unchanged. Desktop landscape scaling also keeps the whole family in frame in tall preview windows. The plain wordmark, exact copy, mobile reading positions and pose comparison are documented in `evidence/walking-refinement/`.

## Earlier Precision verification

These results precede the plain wordmark and the two approved paragraph edits. They do not verify those latest changes.

- Production build and focused ESLint checks pass.
- All six homepage browser tests pass, covering unchanged copy, navigation, motion, reduced motion, WebGL fallback and mobile layout.
- Local font loading, computed typography and the normal-lettering wordmark are verified at 1440px, 390px and 320px widths. Desktop/mobile captures and the verification report are in `evidence/precision/`.
- Those captures show the earlier dotted lowercase `o` and the wording before the two approved edits.

## Earlier comparison verification

- Production build passes, including the new static comparison route.
- Homepage browser results: 26/26 passed, in `evidence/type-study-home/report.md`.
- Typography, fonts, desktop/mobile and keyboard results: 42 accepted checks and zero unresolved findings, in `evidence/type-study/report.md`. Initial findings are retained separately; the final targeted follow-up passes all 23 checks.
- Visual comparison: `evidence/type-study/font-comparison.jpg`.
- Original baseline evidence remains in `evidence/resonance/`.

All work remains local. No source push, deployment, production-domain or DNS change.
