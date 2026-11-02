# Owl's Nest

Prototype for Temple-AI-Build-Challenge.

A responsive Temple campus study-spot finder prototype. It uses sample data and in-memory interactions; crowd reports and student suggestions are not shared and reset when the page reloads.

## Run locally

From this folder, run:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Publish with GitHub Pages

This is a static site with no build step. In the repository's **Settings → Pages**, select the `main` branch and `/ (root)` as the source. GitHub Pages can host the interface; shared reports would need a separate backend.

## Demo behavior

- Use the filters, floor selectors, map markers, and spot detail panel to explore sample locations.
- Submit a crowd report or a community suggestion to see the interaction. The report cooldown and submitted content last only until refresh.
- Location access is requested only after selecting **Use my location**. The prototype uses it in the browser to sort spots and offer a nearby report prompt.
- All crowd ratings are sample reports. They are not live campus occupancy data.

## Sample location references

- [Charles Library study spaces](https://library.temple.edu/services/charles-library-what-you-need-to-know)
- [TECH Center labs and study spaces](https://its.temple.edu/tech-labs-campus)
- [Temple dining options](https://www.temple.edu/life-temple/housing-dining/dining-options)
- [Temple Campus Recreation facilities](https://www.temple.edu/campus-recreation/facilities/hours-operation)

The map and sample coordinates are illustrative and are not to scale.
