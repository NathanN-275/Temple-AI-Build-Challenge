# HootRoute

Prototype for Temple-AI-Build-Challenge.

A responsive Temple campus guide prototype. The home page at `index.html` introduces HootRoute; the interactive finder is at `explore.html`. The selected Owl Pin logo is shown at `logo-concepts.html` and is the current provisional mark. The finder uses sample location data and connects to Supabase for public student suggestions and crowd check-ins. User submissions are visible to other visitors for 24 hours. The finder has separate Location database and Campus map tabs. The map uses independent filters to show multiple categories together, including Temple-listed food trucks on OpenStreetMap.

## Run locally

From this folder, run:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Supabase setup

The project connects from the browser with a Supabase publishable key in `src/supabase-config.js`. The key is designed to be public; never put a secret or service-role key there. The migration in `supabase/migrations/` creates the public submission tables, access policies, and hourly 24-hour cleanup job. The hosted HootRoute project already has this migration applied. To apply future migrations, link the project and push them with the Supabase CLI:

```sh
supabase link --project-ref qhdqecywljrczhrzeezv
supabase db push
```

## Publish with GitHub Pages

This is a static site with no build step. In the repository's **Settings → Pages**, select the deployment branch and `/ (root)` as the source. GitHub Pages hosts the interface; Supabase stores shared suggestions and crowd reports.

## Demo behavior

- Open the landing page at the site root, then choose **Explore the tool** to open the finder.
- Use the **Location database** tab to search and filter campus spots, dining, food trucks, and student suggestions.
- Use the **Campus map** tab to combine map filters for study spots, academic buildings, dining, food trucks, recreation, and student suggestions.
- Zoom the map with the controls, mouse wheel or trackpad, or pinch gestures on touchscreens. Numbered food-truck markers show how many trucks are grouped nearby.
- Temple’s food-truck names, coordinates, and paraphrased menu summaries are based on its maintained [food truck map](https://www.temple.edu/life-temple/housing-dining/temple-food-trucks). The map does not publish per-truck hours, so check with vendors for current schedules. Dining cards and map popups include brief food descriptions; menus at food courts vary by counter. Temple’s dining halls, 12th Street vendors, and Liacouras Walk vendors appear under **Food & dining**.
- Submit a seating check-in or community suggestion. Submissions are shared with visitors and expire after 24 hours. The 15-minute report cooldown is stored in this browser.
- Suggestions have a server-enforced limit of **3 successful submissions per public IP in a rolling 15-minute window**. Visitors sharing campus Wi-Fi may share the quota. The database trigger also guards direct REST inserts and serializes concurrent requests; the form preserves its contents and shows the remaining wait when the server returns HTTP 429.
- The hosted limiter uses Cloudflare's protected `CF-Connecting-IP` header, fails closed when it is missing or invalid, and ignores client-supplied forwarding headers. It stores a salted IP hash in private tables, with hourly cleanup after 24 hours. Administrators writing directly through SQL are exempt. Local Supabase requests need equivalent trusted proxy headers; this hosted setup is not a generic proxy configuration. Changing public IPs can still bypass a per-IP quota.
- Community crowd status uses the median of at least three browser votes from the last hour, counting each browser's latest vote per floor once. Below three votes, cards show **Not enough votes**. An even-count median is rounded to the nearest level, with halves toward busier. Older reports remain stored for the rest of their 24-hour lifetime but do not affect the vote.
- Browser IDs and cooldowns offer basic duplicate handling; clearing storage or forging IDs can bypass them. This does not verify individual students or prevent deliberate ballot stuffing. New votes from other visitors appear on reload; open pages refresh the consensus when an included vote ages out.
- Location access is requested only after selecting **Use my location**. The prototype uses it in the browser to sort spots and offer a nearby report prompt.
- Typical crowd labels summarize sample seating reports, not live campus occupancy data.

The regression checks in `supabase/tests/crowd_consensus.sql` exercise the voting rules as the public role inside a transaction and roll back all fixtures.
`supabase/tests/suggestion_rate_limit.sql` checks quotas, network isolation, invalid submissions, missing IPs, spoofed forwarding headers, and window expiry in a rollback transaction. Live API checks also verified concurrent requests and rejected forged Cloudflare headers.

## Sample location references

- [Charles Library study spaces](https://library.temple.edu/services/charles-library-what-you-need-to-know)
- [TECH Center labs and study spaces](https://its.temple.edu/tech-labs-campus)
- [Temple dining options](https://www.temple.edu/life-temple/housing-dining/dining-options)
- [Temple Campus Recreation facilities](https://www.temple.edu/campus-recreation/facilities/hours-operation)
- [Aramark STAR Complex Weight Room](https://www.temple.edu/campus-recreation/facilities/aramark-star-complex%E2%80%94weight-room)
- [Pearson/McGonigle 3rd Floor Rec Courts](https://www.temple.edu/campus-recreation/facilities/pearsonmcgonigle-hall-3rd-floor-rec-courts)

Study and recreation coordinates are prototype entries; food vendors sharing a Temple-listed area are grouped at that area on the map. Temple maintains the separate food truck map.
