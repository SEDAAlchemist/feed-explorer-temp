# SEDA Composite Feed Explorer

Interactive tool to discover assets for SEDA's Signal Composite (**multi**) OP across
Binance (spot + futures), Lighter, and Hyperliquid — filter by 24h volume and order-book
depth, pick providers, and copy the ready-to-run SEDA Fast curl per asset.

This repo is the **frontend only**: a single, self-contained `index.html`. It reads its
data from a snapshot published to Vercel Blob by a separate data-pipeline repo. There is
no server here, and no live querying of the venues.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Any static file server works. On load, the page fetches the latest published snapshot from
the URL configured at the top of `index.html` (the `DATA_URL` constant), so you see live
data with no local data files in the repo.

## Data source

The dataset (`data.json`) is generated and published by the **data-pipeline** repo, not
here. That repo runs `refresh_data.py` — which pulls universes, prices, volume, and
order-book depth from the venues — and uploads the result to Vercel Blob on a schedule. To
point this frontend at a different snapshot, change the single `DATA_URL` constant near the
top of the `<script>` in `index.html`. Nothing else needs to change.

## Deploy

Deploy as a static site on Vercel (framework preset **Other**, no build step). The site
serves `index.html`, which fetches its data from Blob at runtime — so publishing fresh data
never requires a redeploy.

## Features

- **Provider select** — any combination of the 4 venues. All volume/depth sums and the
  generated curl's `exchanges` array use only the selected providers.
- **Usability thresholds** — min 24h volume and min depth (±0.5% / ±1% / ±2% band), applied
  to the summed value across selected providers. `Src→thresh` shows how many venues (deepest
  first) are needed to clear the depth threshold (1 = one venue alone; "never" = can't reach it).
- **Class filter, search, sortable columns.**
- **Row expand** — per-venue volume + depth (all bands), OP path, and the copy-ready curl.

## Files

| File | Purpose |
|---|---|
| `index.html` | The tool — SEDA-styled, self-contained (HTML/CSS/JS in one file) |
| `fonts/` | Satoshi (SEDA brand font) |

## Composite OP curl

The copy-curl matches the **Signal Composite ("multi") OP** spec exactly (program
`746d6649…136a27`, proxy `multi.proxy.mainnet.seda.xyz`, endpoint
`fast-api.mainnet.seda.xyz/execute?encoding=json`, path `multi/:symbol/:market/:hydroTicker`).
Set `$SEDA_FAST_API_KEY` in your shell before running a copied curl.

- **`exchanges`** = the providers currently selected in the UI (intersected with what the
  asset is actually listed on).
- **`minSources`** = set via the "OP request: minSources" panel (default 1) — how many
  venues must return a quote for the execution to succeed. Clamped to the number of
  exchanges selected for that asset.
- **`path`** = the asset's fixed 3-segment identifier (`symbol/market/hydroTicker`) — this
  doesn't change with provider selection; unused segments are ignored by venues not in
  `exchanges`.
- Result is the **median** of resolved venue mids (`price`), plus each venue's individual
  mid (`prices`). ~3–4s latency (fans out to all venues under one 5s timeout).

See SEDA's Signal Composite OP documentation for the full spec, response envelope,
WebSocket usage, and error handling.
