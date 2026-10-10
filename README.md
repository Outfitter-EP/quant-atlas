# Quant Atlas

An interactive knowledge base for quants. Every topic has a plain explanation, short definitions, 2D and 3D charts, and sliders that change the inputs.

Current content:

- **Inflation**: how an inflation zero curve is bootstrapped from zero-coupon swap quotes.
- **Options and volatility**: a six-step path from payoffs through binomial trees, Black-Scholes, the Greeks and implied volatility to Monte Carlo.

All numbers on the pages are illustrative, not market data.

## How it works

The site is plain static files (HTML, CSS, JavaScript) published with GitHub Pages from the `main` branch. There is no build step. New articles are written in a chat with Claude, tested, and pushed here. See [CLAUDE.md](CLAUDE.md) for the structure and the rules.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Tests

```
node tools/test-options-core.js
PLOTLY_JS=/path/to/plotly.min.js python3 tools/smoke.py
```
