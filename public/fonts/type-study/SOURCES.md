# TripHalo typography study — font provenance

Acquired 14 October 2026 from published Fontsource npm tarballs. These are local Latin-subset WOFF2 files. No package dependencies were added. All six families are licensed under the SIL Open Font License 1.1; the original package licence is preserved beside each font.

The variable axes below were read from each downloaded binary’s `fvar` table after decoding its WOFF2 stream, rather than inferred from family-wide metadata. Exact hashes and byte sizes are in `download-manifest.json`; machine-readable axis ranges are in `verified-axes.json`.

## Pairings

- **Precision:** Mona Sans + IBM Plex Mono. Quiet, compressed sans headlines; mono reserved for small labels.
- **Humanist:** Bricolage Grotesque + Source Sans 3. Expressive sans headlines with clear, warmer reading text.
- **Editorial:** Newsreader + IBM Plex Sans. Entire headings use upright serif, with sans reading text; no decorative italic switch.

## Mona Sans

- Local font: `mona-sans-latin-variable.woff2`
- Primary source: [https://github.com/github/mona-sans](https://github.com/github/mona-sans)
- Fontsource package: `@fontsource-variable/mona-sans@5.3.0`
- Exact download: [https://registry.npmjs.org/@fontsource-variable/mona-sans/-/mona-sans-5.3.0.tgz](https://registry.npmjs.org/@fontsource-variable/mona-sans/-/mona-sans-5.3.0.tgz)
- Font within archive: `package/files/mona-sans-latin-standard-normal.woff2`
- Licence: `mona-sans-OFL.txt`, copied verbatim from `package/LICENSE` in the same tarball.
- Style/subset: upright roman, Latin.
- Size: 98,124 bytes.
- SHA-256: `5ea3740633e5ac7af56c13d7e8ec32bcae12e7723e53d34284469a8947ccb2f3`
- Verified axes: `wdth` 75–125, binary default 100; `wght` 200–900, binary default 200.
- Intended treatment: Precision: headlines weight 550, width 87.5–90; body weight 400, width 100. Set both values explicitly.

The current upstream Mona Sans repository also documents optical size, but this downloaded Fontsource release contains width and weight only. Do not claim or rely on `opsz` for this file.

## IBM Plex Mono

- Local font: `ibm-plex-mono-latin-400.woff2`
- Primary source: [https://github.com/IBM/plex](https://github.com/IBM/plex)
- Fontsource package: `@fontsource/ibm-plex-mono@5.3.0`
- Exact download: [https://registry.npmjs.org/@fontsource/ibm-plex-mono/-/ibm-plex-mono-5.3.0.tgz](https://registry.npmjs.org/@fontsource/ibm-plex-mono/-/ibm-plex-mono-5.3.0.tgz)
- Font within archive: `package/files/ibm-plex-mono-latin-400-normal.woff2`
- Licence: `ibm-plex-mono-OFL.txt`, copied verbatim from `package/LICENSE` in the same tarball.
- Style/subset: upright roman, Latin.
- Size: 14,708 bytes.
- SHA-256: `08949f728dc52d528e69b1667d15c89a5686a4ee9a296ff90983985f99c380f7`
- Static weight: 400. No variable axes.
- Intended treatment: Precision: labels, navigation and small utility text at weight 400. Body paragraphs remain Mona Sans.

## Bricolage Grotesque

- Local font: `bricolage-grotesque-latin-variable.woff2`
- Primary source: [https://github.com/ateliertriay/bricolage](https://github.com/ateliertriay/bricolage)
- Fontsource package: `@fontsource-variable/bricolage-grotesque@5.3.0`
- Exact download: [https://registry.npmjs.org/@fontsource-variable/bricolage-grotesque/-/bricolage-grotesque-5.3.0.tgz](https://registry.npmjs.org/@fontsource-variable/bricolage-grotesque/-/bricolage-grotesque-5.3.0.tgz)
- Font within archive: `package/files/bricolage-grotesque-latin-standard-normal.woff2`
- Licence: `bricolage-grotesque-OFL.txt`, copied verbatim from `package/LICENSE` in the same tarball.
- Style/subset: upright roman, Latin.
- Size: 131,548 bytes.
- SHA-256: `a756882d8a7802ebd4663b4544a62ebedafc7227c1c159ab95eea61393af3f8e`
- Verified axes: `opsz` 12–96, binary default 96; `wght` 200–800, binary default 800; `wdth` 75–100, binary default 100.
- Intended treatment: Humanist: headlines weight 500, width 100, optical size 96. Set weight explicitly; this binary defaults to 800.

## Source Sans 3

- Local font: `source-sans-3-latin-variable.woff2`
- Primary source: [https://github.com/adobe-fonts/source-sans](https://github.com/adobe-fonts/source-sans)
- Fontsource package: `@fontsource-variable/source-sans-3@5.3.1`
- Exact download: [https://registry.npmjs.org/@fontsource-variable/source-sans-3/-/source-sans-3-5.3.1.tgz](https://registry.npmjs.org/@fontsource-variable/source-sans-3/-/source-sans-3-5.3.1.tgz)
- Font within archive: `package/files/source-sans-3-latin-wght-normal.woff2`
- Licence: `source-sans-3-OFL.txt`, copied verbatim from `package/LICENSE` in the same tarball.
- Style/subset: upright roman, Latin.
- Size: 28,872 bytes.
- SHA-256: `19143dca075972bc84e3fd9eab7416dd40cc565dccb2435a044bdfabe060c7d5`
- Verified axes: `wght` 200–900, binary default 200.
- Intended treatment: Humanist: body weight 400 or 450. Set weight explicitly.

## Newsreader

- Local font: `newsreader-latin-variable.woff2`
- Primary source: [https://github.com/productiontype/Newsreader](https://github.com/productiontype/Newsreader)
- Fontsource package: `@fontsource-variable/newsreader@5.3.0`
- Exact download: [https://registry.npmjs.org/@fontsource-variable/newsreader/-/newsreader-5.3.0.tgz](https://registry.npmjs.org/@fontsource-variable/newsreader/-/newsreader-5.3.0.tgz)
- Font within archive: `package/files/newsreader-latin-standard-normal.woff2`
- Licence: `newsreader-OFL.txt`, copied verbatim from `package/LICENSE` in the same tarball.
- Style/subset: upright roman, Latin.
- Size: 132,000 bytes.
- SHA-256: `6e4f2958c3a7c4a80acde4e5a679abe7e01bc1e30b92be3c7a8b696ef401d101`
- Verified axes: `wght` 200–800, binary default 400; `opsz` 6–72, binary default 18.
- Intended treatment: Editorial: full headlines in roman weight 400, optical size 72. No italic accent phrase.

## IBM Plex Sans

- Local font: `ibm-plex-sans-latin-variable.woff2`
- Primary source: [https://github.com/IBM/plex](https://github.com/IBM/plex)
- Fontsource package: `@fontsource-variable/ibm-plex-sans@5.3.0`
- Exact download: [https://registry.npmjs.org/@fontsource-variable/ibm-plex-sans/-/ibm-plex-sans-5.3.0.tgz](https://registry.npmjs.org/@fontsource-variable/ibm-plex-sans/-/ibm-plex-sans-5.3.0.tgz)
- Font within archive: `package/files/ibm-plex-sans-latin-standard-normal.woff2`
- Licence: `ibm-plex-sans-OFL.txt`, copied verbatim from `package/LICENSE` in the same tarball.
- Style/subset: upright roman, Latin.
- Size: 65,488 bytes.
- SHA-256: `1e875856600a34cb44a406a7deef0e3f9ae70e6f636e0f37fbca2248dec2dca4`
- Verified axes: `wght` 100–700, binary default 400; `wdth` 75–100, binary default 100.
- Intended treatment: Editorial: body weight 400; labels 500; width 100.

## Loading notes

Use `font-style: normal` and `font-display: swap`. Declare the relevant weight and stretch ranges in `@font-face`; set weight explicitly in the design. These local files intentionally omit italics and non-Latin subsets. Preserve the adjacent OFL files when redistributing the font assets.
