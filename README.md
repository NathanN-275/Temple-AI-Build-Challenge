# Owl's Nest

Prototype for Temple-AI-Build-Challenge.

A responsive Temple campus guide prototype. The home page at `index.html` introduces Owl’s Nest; the interactive finder is at `explore.html`. The finder uses sample data and in-memory interactions; crowd reports and student suggestions are not shared and reset when the page reloads. The campus food truck map is embedded from Temple University’s public Google My Maps, and the dining directory follows Temple’s published dining options.

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
- Use the filters and floor selectors to explore sample study locations. The map shows Temple’s published food truck locations.
- The dining directory lists Temple’s dining halls, 12th Street vendors, and Liacouras Walk vendors.
- Submit a crowd report or a community suggestion to see the interaction. The report cooldown and submitted content last only until refresh.
- Location access is requested only after selecting **Use my location**. The prototype uses it in the browser to sort spots and offer a nearby report prompt.
- All crowd ratings are sample reports. They are not live campus occupancy data.

## Sample location references

- [Charles Library study spaces](https://library.temple.edu/services/charles-library-what-you-need-to-know)
- [TECH Center labs and study spaces](https://its.temple.edu/tech-labs-campus)
- [Temple dining options](https://www.temple.edu/life-temple/housing-dining/dining-options)
- [Temple Campus Recreation facilities](https://www.temple.edu/campus-recreation/facilities/hours-operation)

Study spot coordinates remain illustrative; the embedded truck map is maintained by Temple University.
