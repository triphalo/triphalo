# Aperture motion study 01

Local route: `/study`. This is a separate visual narrative study; the existing home page remains the content reference.

## What to judge

1. **Alignment.** Three offset, substantial plaster walls establish a partial sightline into an inhabited garden room. Native scrolling moves the layers into alignment.
2. **Passage.** The camera advances through their actual openings. Edges expand around the viewport and pass behind the camera.
3. **Arrival.** The architecture leaves the composition. People, a shared sketchbook, a table and garden light become the destination. Foreground foliage introduces depth and a restrained breeze.

## Study boundaries

This is a 2.5D motion study: the aperture walls and foreground foliage are real-time Three.js geometry; the inhabited world is one generated artwork plate. The people are still within that plate. Character animation, final art direction, sound and full-page copy integration are subsequent decisions. Native scrolling stays reversible; no scroll interception or forced intro. A pause control and static reduced-motion experience are included.

All work is local. No deployment, Git push, domain, DNS or mail changes.

## Verification

Final local production preview: `http://127.0.0.1:3000/study`.

- Production build, TypeScript and ESLint pass.
- Focused Playwright suite: 9/9 passed in 47.4 seconds against the final production build. Desktop 1440px, mobile 390px and narrow 320px; native scroll phase changes; keyboard chapter controls; pause/resume; reduced motion including preference changes; forced WebGL failure; local asset and console checks. Summary: `evidence/study-verification.json`.
- Actual in-app Chrome inspection of opening, passage and arrival at desktop and mobile sizes, including final shallow-focus foliage treatment.
- Homepage HTTP/SSR smoke passed; its original title, headline, canonical and email remain intact. The earlier full-page test suite was not rerun for this isolated study.
- Captures: `evidence/study-captures/`. Continuous desktop scroll recording: `evidence/aperture-study.mp4` (local, ignored by Git).

Limits: automated tests use software WebGL; no physical phone, Safari/Firefox, field performance or hosted deployment verification. This is a motion study, with a still human tableau awaiting later artwork/animation refinement.

## Artwork

Saved asset: `public/study/garden-room.webp` (1536 × 1024, WebP). Generated with the built-in image-generation tool, then encoded as WebP locally with Sharp. The source generation remains in Codex's generated-images directory. The artwork represents a fictional scene, not a client, team or completed project.

### Final generation prompt

Use case: stylized-concept.
Asset type: wide cinematic environmental artwork for an immersive website motion study, landscape 1536x1024.
Create an inviting, inhabited garden studio in late afternoon, seen at human eye level from one end of the room. This is a world worth stepping into: quiet human connection, curiosity, craft, hospitality.
Architecture: a tall airy old conservatory with dusty pink limewash walls and warm pale terrazzo floor. Slender dark bronze windows, open garden doors at the far back, mature leafy trees visible beyond. A long walnut table runs across the middle ground with a slight diagonal, not aimed toward the camera. Around the table are four distinct casually dressed adults with natural anatomies, varied ages and skin tones. An older woman in earthy coral is sharing an open sketchbook with a younger person in indigo; another person is listening with a mug, and one person stands, pulling up a cane chair. A hand-drawn map, loose sketches, a ceramic jug, oranges, a small vase of garden branches. No computers or screens. These people have believable independent gestures and relationships, they are not posing or looking at the camera.
Composition: people and the meaningful table interaction form a readable central cluster in the middle 40% of the image, faces large enough to register. Enough empty sunlit floor in foreground to give an arriving visitor a place. Side edges contain lush plants, a textured wall, a workbench, paper pinned in loose arrangements. There is asymmetry, material character and gentle imperfection. The top third is architecture and leaf-filtered sunlight. No central foreground door frame or circular opening; the website adds that separately.
Visual language: sophisticated cinematic illustration, almost tactile stop-motion set, painterly realism with soft imperfect surfaces, physically believable depth, beautiful detailed vegetation, graceful adult proportions. Warm muted terracotta, olive green, wheat, pale ivory, a small indigo accent. Rich luminous daylight, soft dappled leaf shadows, restrained editorial colour grading. Intriguing and inhabited, never corporate stock photography, never a luxury hotel advert, never fantasy elves. No lettering, typography, logos, UI, watermarks or borders.

