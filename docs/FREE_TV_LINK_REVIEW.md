# Connect Free TV link review

The Free TV directory uses links to official broadcaster websites and players. It does not scrape streams, proxy video, bypass geo-blocking, or embed a broadcaster's player without permission.

## Automated weekly check

The `Connect Free TV link review` GitHub Actions workflow runs every Monday at 08:23 UTC and can also be started manually from Actions. It checks each listed official destination using HTTP requests and uploads a JSON report as a 30-day workflow artifact.

## How to interpret results

- **Reachable:** the destination returned a successful HTTP response. This does not prove a live stream is playing or that it is available in every country.
- **Manual review:** the site blocked automated requests, required a browser/session, rate-limited the check, or otherwise did not provide a reliable automated answer.
- **Needs review:** the destination returned a response that merits human inspection or the request failed.

A channel should only be marked as confirmed available after a human checks the official service, country restrictions, account/paywall conditions, and whether the page is actually offering the advertised content. HTTP checks cannot determine programme rights, local laws, current schedules, or permission to embed.

## Manual review procedure

1. Open the latest workflow run and download the `connect-free-tv-link-report` artifact.
2. Review every item marked `manual-review` or `needs-review` in a normal browser.
3. Confirm that the link belongs to the broadcaster and the advertised category/service is still accurate.
4. Update the URL, description, or access note in `app/free-tv/free-tv-directory.tsx`, or remove the listing if it is no longer appropriate.
5. Re-run the workflow after editing.

The public directory must continue to describe access as subject to broadcaster terms and regional rights. A reachable homepage must never be represented as proof that a free live TV stream works worldwide.
