# Tholafind

A visual product-search MVP: snap or upload a photo of something you can't find, and Tholafind
searches retail, resale, and vintage sources at once — with a crowdsourced fallback for the hard cases.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## What's in this MVP

- `app/page.tsx` — Landing page: hero with the photo-upload flow, "how it works," feature grid,
  and honest/transparent pricing (free tier shows real results before any paywall).
- `app/results/page.tsx` — Masonry results grid with source filters (retail / resale / vintage),
  confidence "stamps" on each card, and a crowd-assist banner when results are low-confidence.
- `app/collections/page.tsx` — Saved hunts as folders, so searches persist and can be revisited.
- `components/` — Navbar, UploadDropzone (with a scan animation), ResultCard, StampBadge, Footer.
- `lib/mockData.ts` — Mock search results and collections used throughout the demo (no backend yet).

## Design direction

A field-guide / specimen-catalog aesthetic (deep pine green, warm linen paper, brass "match" stamps,
stitched card borders) — a masonry browsing layout in the spirit of Pinterest, but with its own identity
built around the idea of tracking something down rather than passive browsing.

## Next steps for a real backend

- Replace `lib/mockData.ts` with a real image-recognition + multi-source search API.
- Add auth and persist collections per user.
- Wire the "Ask the finders" button to a real community-request flow.
- Add the Plus subscription (Stripe) and price/listing alert notifications.
