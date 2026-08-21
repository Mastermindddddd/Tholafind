# Tholafind — Implementation Plan

Turning the current MVP (static mock data, no backend) into a working product, phased so each
step is independently shippable and testable before moving to the next.

---

## Phase 0 — Foundations
**Goal:** a real backend and data layer exist before any feature logic is built on top.

1. **Pick the stack.**
   - Database: MongoDB Atlas (managed, and gives you Atlas Vector Search in the same database
     for Phase 3 — no separate vector store needed).
   - ODM: Mongoose (the more natural fit for MongoDB than Prisma — native migrations aren't
     really a MongoDB concept, and Mongoose's schema/validation layer covers what you lose).
   - Auth: Clerk or Auth.js (NextAuth) — Clerk is faster to stand up for an MVP.
   - File storage: Vercel Blob or Cloudflare R2, for user-uploaded photos.
   - Hosting: Vercel (pairs cleanly with Next.js App Router).
2. **Define the core data model** in Mongoose schemas: `User`, `Search`, `SearchResult`,
   `Collection`, `CollectionItem`, `CommunityRequest` (with `CommunityAnswer` embedded as a
   subdocument array, since answers are always read alongside their parent request), `Alert`,
   `Subscription`. Reference `User`/`Search`/`Collection` by ObjectId across collections rather
   than embedding, since those are accessed and updated independently.
3. **Stand up environments**: a local MongoDB instance (or an Atlas free-tier dev cluster), a
   staging Atlas cluster, and a production Atlas cluster, so later phases can be tested safely
   before going live.
4. **Wire basic CI**: run `next build` and a schema-validation/lint step for the Mongoose models
   on every push, so broken builds are caught before merge (this MVP's clean build is the
   baseline to protect going forward). Since there's no migration system to run, add a small
   startup check that confirms required indexes (see below) exist on each collection.

**Deliverable:** an empty but real backend — a user can be created, a document can be written
and read from Atlas.

> **A note on going with MongoDB over Postgres:** the relational parts of this app — a
> `CollectionItem` pointing at a `SearchResult` pointing at a `Search` pointing at a `User` — are
> handled with ObjectId references and `.populate()`/`$lookup` instead of foreign keys, which
> means referential integrity (e.g. cleaning up a `CollectionItem` if its `Search` is deleted)
> needs to be handled explicitly in application code, not enforced by the database. Where Mongo
> pays off directly for Tholafind: `SearchResult.metadata` can vary freely per source without a
> migration, `CommunityRequest`/`CommunityAnswer` read naturally as one document, and Atlas
> Vector Search covers Phase 3's similarity matching in the same database — no separate vector
> store to run.

---

## Phase 1 — Accounts
**Goal:** every search and collection belongs to a real, persistent user.

1. Integrate Clerk (or Auth.js): sign up / log in, session handling, protected routes.
2. Add a `User` document on first login (Mongoose), keyed on the auth provider's user ID.
3. Gate `/collections` behind auth; allow anonymous use of `/` and `/results` (searching should
   stay frictionless — don't force signup before someone sees value, per the "honest monetization"
   principle from the research).
4. Add a lightweight onboarding step: ask what people usually hunt for (fashion, furniture,
   vintage, etc.) — this seeds better default filters later, and doubles as a soft "aha" moment.

**Deliverable:** users can create an account; anonymous search still works.

---

## Phase 2 — Real photo upload
**Goal:** replace the local `URL.createObjectURL` preview with an actual persisted image.

1. On upload in `UploadDropzone`, `POST` the file to an API route (`/api/upload`).
2. Store the file in Blob/R2, save the resulting URL + a `Search` document (status: `pending`).
3. Return the `Search.id` to the client and redirect to `/results/[searchId]` instead of the
   static `/results` route.
4. Add basic validation: file size cap, image-only MIME check, and a friendly error state if
   upload fails (in the interface's voice: "That image didn't upload — try again or use a
   different photo," not a raw error).

**Deliverable:** a real photo is stored and tied to a real search record; results page is now
per-search instead of one hardcoded page.

---

## Phase 3 — Multi-source search (the core feature)
**Goal:** answer the #1 researched complaint — dead ends from single-catalog tools — by actually
querying multiple sources per search.

1. **Visual matching layer:** generate an embedding for the uploaded photo (CLIP-based model via
   Replicate, or a hosted multimodal embedding API). Store it on the `Search` document as an
   array field, and create an **Atlas Vector Search index** on that field so MongoDB itself can
   run the similarity search — no separate vector database needed.
2. **Retail + general product search:** integrate a reverse-image/product-search API (e.g. a
   Google Lens–style API via SerpApi, or Bing Visual Search API) to pull retail matches.
3. **Marketplace search:** integrate official APIs where they exist —
   - eBay Browse API (broad secondhand + retail coverage, well-documented, free tier).
   - Etsy Open API (vintage/handmade).
   - Depop/Poshmark/Vinted currently have no public search APIs — flag this as a real constraint;
     plan either a partnership/data-license conversation, or start without them and add later.
4. **Normalize results** from every source into one shape (title, price, image, source, URL).
   This is a good spot to lean into MongoDB's flexible schema: keep the shared fields consistent
   across sources, but allow a source-specific `metadata` subdocument to vary freely (a resale
   listing might carry condition/seller rating, a retail listing might carry stock status) without
   needing a schema migration every time a new source is added. Write these as `SearchResult`
   documents linked to the `Search` by ObjectId.
5. **Confidence scoring:** bucket each result into `exact` / `close` / `guess` using the similarity
   score returned by the Atlas Vector Search query (this feeds the `StampBadge` component directly —
   no UI change needed, just real data instead of mock data).
6. Update `/results/[searchId]` to fetch real `SearchResult` documents instead of `mockResults`.

**Deliverable:** uploading a real photo returns real, multi-source results with genuine confidence
scores — the mock data in `lib/mockData.ts` is no longer used for actual searches.

---

## Phase 4 — Built for messy photos
**Goal:** answer the #2 researched complaint — poor accuracy on blurry/cropped/low-light photos —
by making the product responsive to low confidence, instead of silently failing.

1. If every result for a search comes back below the "close" threshold, set a
   `status: "low_confidence"` field on the `Search` document and surface the existing UI pattern
   already in `UploadDropzone`/`results` page: prompt for a second angle, a tag close-up, or
   better lighting.
2. Add an optional text-hint field to the upload flow (color, material, brand guess) that gets
   appended to the search query sent to the retail/marketplace APIs, narrowing ambiguous matches.
3. Support multi-image search: let a search have 2–3 attached photos (e.g. front + tag close-up),
   weighting the embedding match across all of them.

**Deliverable:** low-confidence searches actively guide the user to improve results, rather than
just returning a bad best-guess.

---

## Phase 5 — Persistent collections
**Goal:** answer the #3 researched complaint (competitors losing users' screenshots) — the UI
already exists in `/collections`, this phase makes it real.

1. `POST /api/collections` and `POST /api/collections/:id/items` — creating collections and
   saving a `SearchResult` into one (this is what the heart icon on `ResultCard` should call).
2. Every search a user runs while logged in is auto-saved to a default "All hunts" collection —
   no extra action required, directly matching the "nothing gets lost" promise on the page.
3. Replace `mockCollections` in `/collections` with a real query, scoped to the logged-in user.
4. Add collection rename/delete and moving items between collections.

**Deliverable:** collections persist across sessions and devices tied to a real account.

---

## Phase 6 — Crowd-assist fallback
**Goal:** answer the #4 pain point (dead ends when AI can't identify something) by making the
"Ask the finders" button in `/results` actually do something.

1. `POST /api/community-requests` — turns a low-confidence `Search` into a public `CommunityRequest`
   with the photo and any hints the user provided.
2. Build a lightweight community feed (`/community`) where any logged-in user can browse open
   requests and submit an `CommunityAnswer` (a link + short note).
3. Notify the original requester (email via Resend, or in-app) when someone answers.
4. Add a simple `helpfulAnswerCount` field on `User`, incremented whenever one of their
   `CommunityAnswer` subdocuments gets marked helpful — surfaced next to a responder's name,
   incentivizing good-faith participation without overbuilding a full gamification system for v1.
5. Rate-limit free-tier requests (2/month, per the pricing already shown on the landing page) —
   enforce this server-side in the `POST` handler.

**Deliverable:** a real, working crowdsourced fallback loop, gated by the pricing tiers already
designed into the landing page.

---

## Phase 7 — Alerts
**Goal:** deliver on the "price-drop and new-listing alerts" promise shown in the Plus tier and
the collections page.

1. Add an `Alert` document referencing a `Search` or `CollectionItem` by ObjectId (watch for new
   listings / price drops on a specific item).
2. Build a scheduled job (Vercel Cron or a queue like Inngest) that re-runs the relevant source
   query for active alerts on an interval (e.g. daily) and diffs against previously seen results
   (store a `lastSeenResultIds` array on the `Alert` document to make the diff cheap).
3. On a match, send a notification (email first; push/in-app later) and log it against the
   `Search` so it shows up in the collection history, not just as a one-off email.

**Deliverable:** alerts actually fire, not just appear as UI copy.

---

## Phase 8 — Honest monetization
**Goal:** implement the Free/Plus tiers already designed on the landing page, without ever
gating the *first* real result — the core promise from the research.

1. Integrate Stripe Checkout + Billing for the $5/mo Plus tier.
2. Enforce tier limits server-side (not just in the UI): 3 saved collections and 2 community
   requests/month on Free; unlimited on Plus. Every search itself (the core value) stays
   unlimited and free regardless of tier.
3. Add a `Subscription` document synced via Stripe webhooks (`checkout.session.completed`,
   `customer.subscription.updated/deleted`) — keyed on the Stripe customer ID for easy lookup.
4. Build the upgrade prompt to appear only when a real limit is hit (e.g. trying to save a 4th
   collection) — never before the user has gotten a result, matching the "no surprise paywalls"
   messaging already on the landing page.

**Deliverable:** real subscriptions, enforced honestly, matching the pricing already promised
to users on the landing page.

---

## Phase 9 — Polish and launch readiness
1. Add empty/error states everywhere data can fail to load (search timeout, no results found,
   upload failure) — written in the interface's voice per the existing copy style.
2. Add analytics (PostHog or Vercel Analytics) on the funnel that matters most: upload → results
   viewed → save or ask-the-finders → return visit. This tells you which phase 3–6 feature is
   actually reducing the "I gave up searching" drop-off.
3. Accessibility pass: keyboard navigation through the masonry grid, alt text on result images,
   confirm focus states (already scaffolded in `globals.css`) work through every new flow.
4. Load-test the multi-source search path — it's the slowest part of the product (multiple
   external API calls per search) and the one most likely to feel broken if it's not fast.
5. Closed beta with a small group from the exact communities researched (r/findfashion,
   r/HelpMeFind) — they're both the target user and the best source of "this still doesn't find
   my item" feedback before a public launch.

---

## Suggested sequencing

Phases 0–2 are strictly sequential (each depends on the last). From there:

- **Phase 3 (multi-source search) is the critical path** — nothing else is real without it.
- Phases 4, 5, and 6 can be built in parallel once Phase 3 is live, since they touch different
  parts of the product (search quality, collections, community).
- Phase 7 (alerts) depends on Phase 5 (collections) existing first.
- Phase 8 (monetization) should come after 4–6 are functional, since it's gating features that
  need to actually work before they're worth paying for.
- Phase 9 runs continuously, not just at the end — start analytics and empty-state polish as
  early as Phase 3, don't save all of it for last.
