# HootRoute

Prototype for Temple-AI-Build-Challenge.

A responsive Temple campus guide prototype. The home page at `index.html` introduces HootRoute; the interactive finder is at `explore.html`. The selected Owl Pin logo is shown at `logo-concepts.html` and is the current provisional mark. The finder uses sample data and in-memory interactions; crowd reports and student suggestions are not shared and reset when the page reloads. The finder has separate Location database and Campus map tabs. The map uses independent filters to show multiple categories together, including Temple-listed food trucks on OpenStreetMap.

## Run locally

From this folder, run:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Publish with GitHub Pages

This is a static site with no build step. In the repository's **Settings → Pages**, select the `main` branch and `/ (root)` as the source. GitHub Pages can host the interface; shared reports would need a separate backend.

## Demo behavior

- Open the landing page at the site root, then choose **Explore the tool** to open the finder.
- Use the **Location database** tab to search and filter campus spots, dining, food trucks, and student suggestions.
- Use the **Campus map** tab to combine map filters for study spots, academic buildings, dining, food trucks, recreation, and student suggestions.
- Zoom the map with the controls, mouse wheel or trackpad, or pinch gestures on touchscreens. Numbered food-truck markers show how many trucks are grouped nearby.
- Temple’s food-truck names, coordinates, and paraphrased menu summaries are based on its maintained [food truck map](https://www.temple.edu/life-temple/housing-dining/temple-food-trucks). The map does not publish per-truck hours, so check with vendors for current schedules. Dining cards and map popups include brief food descriptions; menus at food courts vary by counter. Temple’s dining halls, 12th Street vendors, and Liacouras Walk vendors appear under **Food & dining**.
- Submit a seating check-in or a community suggestion to see the interaction. The report cooldown and submitted content last only until refresh.
- Location access is requested only after selecting **Use my location**. The prototype uses it in the browser to sort spots and offer a nearby report prompt.
- Typical crowd labels summarize sample seating reports, not live campus occupancy data.

## Sample location references

- [Charles Library study spaces](https://library.temple.edu/services/charles-library-what-you-need-to-know)
- [TECH Center labs and study spaces](https://its.temple.edu/tech-labs-campus)
- [Temple dining options](https://www.temple.edu/life-temple/housing-dining/dining-options)
- [Temple Campus Recreation facilities](https://www.temple.edu/campus-recreation/facilities/hours-operation)

Study and recreation coordinates are prototype entries; food vendors sharing a Temple-listed area are grouped at that area on the map. Temple maintains the separate food truck map.
