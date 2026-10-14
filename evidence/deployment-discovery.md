# Deployment discovery

Verified on 14 October 2026. Discovery was read-only: no Vercel project or deployment was created, and no Git push, webhook change, domain assignment, DNS change or mail change was made.

## Confirmed destination

- Repository: [triphalo/triphalo](https://github.com/triphalo/triphalo), public, default branch `master`.
- Vercel team: **Jack's projects**, slug `jacks-projects-6c2ad7d5`, ID `team_DUuggmQ9UyIYJqd44oWOTmKH`.
- The authenticated Vercel API reports the team's plan as `pro` and billing status as `active`.
- Vercel CLI `53.2.0` is installed and authenticated. The connector and CLI resolve to the same team.
- No TripHalo Vercel project exists in that team. A new project named `triphalo` is the proposed destination; it has no project ID yet.

## Exact preview blocker

Account access is available. The blocker is Vercel's first-deployment rule and the brief's preview-only authority: **the first deployment of a new project is always classified as Production**, even when requested from a non-production branch or without `--prod`. Explicit `--target=preview` does not establish a safe first-preview path. The standard preview rules apply after that first deployment exists.

Sources: [Vercel environment documentation](https://vercel.com/docs/deployments/environments#first-deployment), [Vercel CLI documentation](https://vercel.com/docs/cli/deploy#prod), and [reproduction including explicit preview targets](https://github.com/vercel/vercel/issues/17069).

The supported staging mechanism is `--prod --skip-domain`. It creates a Production-target deployment without promoting the project's domains; it does not turn the deployment into Preview. [Vercel documents that distinction](https://vercel.com/docs/cli/deploy#skip-domain). No production bootstrap was attempted under the current authority.

The smallest additional decision is approval to initialise a new, protected TripHalo project with one staged Production-target deployment, without any custom domain or Git connection, then create the requested Preview deployment. This would leave the existing Framer site and mail routing intact. It remains a separate decision from releasing the redesign on the public domain.

## Current production and mail

Direct HTTPS and DNS queries confirmed:

| Item | Verified value |
| --- | --- |
| `https://triphalo.com/` | HTTP 308 to `https://www.triphalo.com/` |
| `https://www.triphalo.com/` | HTTP 200, served by Framer |
| Apex A records | `35.71.142.77`, `52.223.52.2` |
| `www` CNAME | `sites.framer.app.` |
| MX | priority 10 `mail.protonmail.ch.`, priority 20 `mailsec.protonmail.ch.` |
| Nameservers | `ns-cloud-d1.googledomains.com.` through `ns-cloud-d4.googledomains.com.` |

Use `https://www.triphalo.com/` as the intended canonical URL. The complete DNS zone, including all TXT/DKIM/DMARC records, was not inventoried; this table is not a full zone backup.

## Legacy repository integration risk

GitHub reports **zero Actions workflows**, but an active Netlify webhook exists: ID `468951539`, endpoint `https://api.netlify.com/hooks/github`. It subscribes to `push`, `create`, `delete`, `pull_request`, `pull_request_review`, `pull_request_review_comment` and `issue_comment`.

A branch push or PR can therefore invoke the legacy Netlify integration. Its current site, branch configuration and effect have not been established. No conclusion is made that it controls the live Framer domain. Direct Vercel upload avoids invoking this GitHub hook; do not publish the branch remotely until its effect is understood or a separately authorised integration change removes the risk.

The previous starter's `netlify.toml` specified `npm run build`, output `public`, Node `14.15.0` and Yarn `1.22.4`. Its Gatsby/Netlify CMS architecture is being replaced; repository history remains available. Removing that file locally does not disable the external webhook.

## Steps after approval to initialise the review project

1. Create `triphalo` in team `team_DUuggmQ9UyIYJqd44oWOTmKH`, without a Git connection or custom domains. Record its returned project ID. Confirm deployment protection before uploading the build.
2. Prepare an isolated temporary directory containing only a minimal static placeholder. Link it to that exact project and team, with the static framework preset and no environment variables. This empty bootstrap keeps the redesign out of the initial Production-target deployment.
3. Run `vercel deploy --scope jacks-projects-6c2ad7d5 --prod --skip-domain` from the isolated placeholder directory. Inspect the returned deployment and confirm it is staged, protected and has no custom-domain assignment.
4. With that first deployment retained, link this checkout to the same project, configure the Next.js framework and `npm run build`, and confirm the intended source commit. Run `vercel deploy --scope jacks-projects-6c2ad7d5 --target preview` from this app directory. Confirm the returned deployment is actually Preview and READY before describing it as such. This frontend requires no production service credentials.
5. Exercise the deployed page, assets, email link, responsive composition, fallback and motion behaviour. Record the deployment ID, URL, source commit and test results for Jack's review.

Do not run these steps without the initialisation decision. Do not reuse an unrelated existing Vercel project to avoid the first-deployment rule.

## Public-domain cutover after approval of the finished preview

1. Recheck current DNS and take a complete zone snapshot. Keep the Framer site available for rollback. Review the Netlify hook before any Git publication.
2. Create and test a staged production build of the approved source. Confirm that its canonical URL remains `https://www.triphalo.com/`.
3. Add `www.triphalo.com` and `triphalo.com` to the confirmed TripHalo Vercel project, with the apex redirecting permanently to `www`. Complete ownership verification if Vercel requests it.
4. Read Vercel's exact project-specific DNS requirements. At the current DNS provider, change only the web-serving records needed for those hosts. Preserve Proton MX, SPF/DKIM/DMARC and other unrelated records, and preserve the existing nameservers. No Vercel IP or CNAME target is preselected here.
5. Promote the tested production deployment as part of the authorised cutover. Verify TLS, apex-to-www redirect, homepage/assets, canonical/social metadata and email link on the public host. Recheck mail DNS against the zone snapshot.
6. If public verification fails, restore the captured Framer web records and confirm the original site responds. Retain Framer until the public replacement has been accepted.
