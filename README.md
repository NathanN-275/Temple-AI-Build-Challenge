# Owl's Nest

Prototype for Temple-AI-Build-Challenge.

A responsive Temple campus guide prototype. The home page at `index.html` introduces Owl’s Nest; the interactive finder is at `explore.html`. The finder uses sample data and in-memory interactions; crowd reports and student suggestions are not shared and reset when the page reloads. Its campus map plots study, dining, and recreation spots on OpenStreetMap; Temple’s food truck map remains available as a separate layer.

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
- Use the filters and floor selectors to explore study, dining, and recreation locations. The **Campus spots** map layer shows those locations; **Food trucks** opens Temple’s maintained map.
- Temple’s dining halls, 12th Street vendors, and Liacouras Walk vendors appear under **Food**.
- Submit a crowd report or a community suggestion to see the interaction. The report cooldown and submitted content last only until refresh.
- Location access is requested only after selecting **Use my location**. The prototype uses it in the browser to sort spots and offer a nearby report prompt.
- All crowd ratings are sample reports. They are not live campus occupancy data.

## Sample location references

- [Charles Library study spaces](https://library.temple.edu/services/charles-library-what-you-need-to-know)
- [TECH Center labs and study spaces](https://its.temple.edu/tech-labs-campus)
- [Temple dining options](https://www.temple.edu/life-temple/housing-dining/dining-options)
- [Temple Campus Recreation facilities](https://www.temple.edu/campus-recreation/facilities/hours-operation)
- [Aramark STAR Complex Weight Room](https://www.temple.edu/campus-recreation/facilities/aramark-star-complex%E2%80%94weight-room)
- [Pearson/McGonigle 3rd Floor Rec Courts](https://www.temple.edu/campus-recreation/facilities/pearsonmcgonigle-hall-3rd-floor-rec-courts)

Study and recreation coordinates are prototype entries; food vendors sharing a Temple-listed area are grouped at that area on the map. Temple maintains the separate food truck map.
