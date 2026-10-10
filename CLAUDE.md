# Quant Atlas: instructions for Claude

This repo is a static website, a knowledge base for a quant, published with GitHub Pages from the `main` branch (root folder).
The owner asks questions in chat, often from a phone. For each question: research it, build the pages, file them in the right category, test, commit and push to `main`. GitHub Pages then updates the live site.

## The owner's rules (always apply)

- Research first, using current sources. Cite them in a "Sources" list at the end of each article.
- Explain visually. Prefer interactive 2D or 3D charts with sliders that change the inputs, so the learner sees what moves. Add chips for modes and presets where useful.
- Explain terms briefly and clearly ("Terms in one breath"). Add longer explanations only where needed, inside a collapsible "Go deeper" block.
- Choose a sensible teaching order. A big topic becomes a numbered path of articles (see the options path, steps 1 to 6).
- Every new question goes into the best-fitting category. If no category fits, add one.
- Do not change existing articles unless the owner asks. New material is added, not rewritten.
- The site must look good and work on a phone (400px wide) in light and dark theme.
- Numbers on pages are illustrative examples, not market data. Never present invented figures as real data.
- Writing style: plain, short sentences. No em-dash asides, no "not X but Y" framing, no emoji.

## Layout

```
index.html              home: hero, category grid, article list, search
category.html           one page for every category, uses ?c=<category id>
articles/<id>.html      one page per article
assets/site.css         all styles and the two colour themes
assets/site.js          shared helpers, theme (remembered in localStorage), header, article cards
assets/registry.js      CATEGORIES and ARTICLES: the one list that drives home, categories and navigation
assets/labkit.js        shared lab builder: helpers (sld, fx, ro, P2, scene, ...) and mkLab/labRender
assets/home.js          home page, category page and the hero animation
assets/inflation-core.js, inflation.js        inflation article maths and labs
assets/options-core.js, options-labs.js       option pricing maths and the 12 option labs
tools/smoke.py          full-site browser test
tools/test-options-core.js   numerical tests for the option maths
```

## How to add an article

1. Research the question. Use web search. Note the sources.
2. Decide the category in `assets/registry.js`. Add a category object if none fits. `also:['other-category']` lists the article in a second category too.
3. Copy an existing page in `articles/` as the template (head, `data-page="article" data-id data-root="../"`, header placeholder, footer, script tags). Keep the structure of the body: `.kick` tags, `h1`, `.sub`, "The idea", "Terms in one breath" (`dl.gloss`), formulas (`.formula`), the labs, `details.deep` for the longer explanation, "Sources".
4. Put maths in a pure, testable file `assets/<topic>-core.js` (with a `module.exports` guard) and write numerical tests in `tools/test-<topic>-core.js`. Check against known values or finite differences before trusting it.
5. Put the labs in `assets/<topic>-labs.js` as `LABSPEC.<key>={title, chips, sliders, buttons, plots:[heights], captions, calc, render(st,c){...}}`. Place `<div class="lab" data-lab="<key>"></div>` in the page. In `render`, draw with `P2(c,i,traces,xTitle,yTitle,opts)` for 2D, `c.plot(i,[surface],scene(...))` for 3D, and set readouts with `c.ro(...)` and `c.calc(...)`. Load order in the page: Plotly CDN, `registry.js`, `site.js`, core, `labkit.js`, labs. End the labs file with `initLabs(); renderLabs(); onThemeChange(renderLabs);`.
6. Add the article to `ARTICLES` in `assets/registry.js` (id, cat, title, summary, tags, date, and `step` and `short` if it belongs to a numbered path).
7. For a numbered path, update the "Step n of N" tags and path navigation on the sibling pages.

## Quality bar before every push

Run both tests from the repo root:

```
node tools/test-options-core.js
PLOTLY_JS=/tmp/plotly/node_modules/plotly.js-dist-min/plotly.min.js python3 tools/smoke.py
```

If the sandbox cannot reach the CDN, install Plotly locally first: `npm i plotly.js-dist-min@2.35.2 --prefix /tmp/plotly`. The smoke test serves the repo, opens every page in light and dark at 400px width, exercises every lab control, and checks links, overflow and script errors. Look at one screenshot of any new chart (`--shots DIR`). Fix what the test or screenshot shows, then push.

Use the exact Plotly version `2.35.2` from jsDelivr on every page.

## Publishing

- Commit to `main` and push. GitHub Pages rebuilds in about a minute. Commit messages are short and say what was added.
- If the sandbox blocks the live site, say that the push succeeded and give the page URL for the owner to open.
- After a push, tell the owner what was added, in one or two sentences, and give the link to the new page.
- A custom domain, if the owner sets one up, is the `CNAME` file in the repo root.
