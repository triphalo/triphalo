# Typography study — final verification

**42 accepted checks; zero unresolved failures.** This aggregates unchanged checks from the initial run with the targeted checks after comparison-drawer fixes. The homepage's separate final verifier passed 26/26; its baseline evidence was preserved.

All six local fonts load and decode. All four directions preserve copy, contact, the canvas and reading position. Desktop 1440×1000, mobile 390×844 and narrow 320×740 layouts were checked. Reloaded look URLs, native Back to no-query Precision, keyboard drawer focus and touch reopening pass.

## Reading position

Changing font metrics permits browser scroll anchoring within one 32px text line. The observed deltas were:

| Direction | Scroll delta |
| --- | ---: |
| precision | 0 px |
| humanist | -5 px |
| editorial | -21 px |
| baseline | 12 px |

Canvas identity and renderer time/frame continuity were checked strictly.

## Resolved findings and limits

- Expanded Current drawer now clears the complete 320px headline.
- Minimized controls no longer cover the 390px introduction. At 320px the existing introduction begins below the fold; real wheel scrolling confirms clear text above the fixed control band.
- Final 320px Precision clearance is 3.97 px after chapter controls and 5.59 px before Motion.
- Keyboard reopening focuses the selected option; closing focuses the reopen button.
- No browser or asset errors were observed.

## Evidence

- [Final targeted follow-ups](followup-report.json)
- [Final Precision clearance](precision-final-report.json)
- [Corrected focus and narrow reading-area checks](controls-final-report.json)
- [Original findings, preserved](initial-report.md) and [raw initial results](initial-report.json)
- [Pre-correction follow-up findings](followup-report-initial.json)
- Screenshots: desktop-{precision,humanist,editorial,baseline}.png; mobile-*.png; narrow-*-panel.png; narrow-*-intro.png.
