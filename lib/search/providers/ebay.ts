import 'server-only';
import { RawCandidate } from '../types';

interface EbayItem {
  title?: string;
  image?: { imageUrl?: string };
  price?: { value?: string; currency?: string };
  /** Auction-format listings have no fixed price — eBay represents their
   * real, displayed "current bid" amount under this separate field
   * instead. Missing this was a real gap: any auction result silently
   * showed "Price unavailable" even though the actual eBay page clearly
   * shows a bid amount. */
  currentBidPrice?: { value?: string; currency?: string };
  itemWebUrl?: string;
  /** Only present when the request includes an affiliateCampaignId — see
   * buildEndUserCtxHeader() below. Must be used instead of itemWebUrl to
   * actually receive eBay Partner Network commission; eBay's own docs are
   * explicit that itemWebUrl alone doesn't carry the tracking ID. */
  itemAffiliateWebUrl?: string;
  condition?: string;
  itemId?: string;
}

/**
 * eBay Partner Network affiliate tracking, built into the Browse API
 * natively — no separate link-wrapping step. Passing a campaign ID in this
 * header makes the API return `itemAffiliateWebUrl` on each item, which is
 * what must be used to actually earn commission (confirmed against eBay's
 * own Browse API docs, not assumed).
 *
 * Skipped gracefully when EBAY_EPN_CAMPAIGN_ID isn't set — search still
 * works and returns the plain itemWebUrl, just without affiliate tracking.
 * This is a monetization add-on, not something search depends on.
 */
function buildEndUserCtxHeader(): string | undefined {
  const campaignId = process.env.EBAY_EPN_CAMPAIGN_ID;
  if (!campaignId) return undefined;
  return `affiliateCampaignId=${campaignId}`;
}

/**
 * eBay issues Sandbox keys instantly but reviews Production keyset
 * applications before approving them. Set EBAY_ENVIRONMENT=sandbox to test
 * the integration (OAuth flow, request/response shape, error handling)
 * while waiting on approval, then switch to 'production' (the default)
 * once you're approved — no code change needed either way.
 *
 * Caveat worth knowing: Sandbox doesn't mirror eBay's real live inventory,
 * so results will be sparse/synthetic test data. It's good for confirming
 * your integration code is wired correctly, not for judging real search
 * quality — that only becomes meaningful once you flip to production.
 */
const EBAY_ENV = process.env.EBAY_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';
const EBAY_API_ROOT =
  EBAY_ENV === 'sandbox' ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';

// Cached in module scope: fine for a single serverless instance's lifetime,
// resets on cold start. eBay application tokens are valid for ~2 hours, so
// this avoids re-minting one on every search within that window. Keyed by
// environment so toggling EBAY_ENVIRONMENT mid-process (e.g. in dev) can't
// serve a sandbox token against the production API or vice versa.
const tokenCache = new Map<string, { value: string; expiresAt: number }>();

async function getEbayAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not set.');
  }

  const cached = tokenCache.get(EBAY_ENV);
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.value;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${EBAY_API_ROOT}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  });

  if (!res.ok) {
    throw new Error(
      `eBay OAuth token request failed (${EBAY_ENV}): ${res.status} ${await res.text()}`
    );
  }

  const data = await res.json();
  tokenCache.set(EBAY_ENV, {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  return data.access_token;
}

/**
 * Text-based search (eBay has no public reverse-image endpoint on the
 * Browse API) — the query comes from the user's hint or an inferred title
 * from the Lens results. See confidence.ts for why this is capped below
 * 'exact' regardless of how well it ranks.
 */
export async function searchEbay(query: string): Promise<RawCandidate[]> {
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    console.warn('[ebay] EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not set — skipping resale search.');
    return [];
  }

  const token = await getEbayAccessToken();

  const url = new URL(`${EBAY_API_ROOT}/buy/browse/v1/item_summary/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');

  const endUserCtx = buildEndUserCtxHeader();
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      ...(endUserCtx ? { 'X-EBAY-C-ENDUSERCTX': endUserCtx } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`eBay search failed (${EBAY_ENV}): ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const items: EbayItem[] = data.itemSummaries || [];

  return items
    .map((it): RawCandidate | null => {
      if (!it.image?.imageUrl || !it.itemWebUrl || !it.title) return null;
      return {
        title: it.title,
        image: it.image.imageUrl,
        // Fixed-price listings use `price`; auction-format listings have
        // no fixed price at all and carry their current bid under
        // `currentBidPrice` instead — both represent a real, displayed
        // price on the actual eBay page, so both need checking.
        price: it.price?.value
          ? `$${it.price.value}`
          : it.currentBidPrice?.value
            ? `$${it.currentBidPrice.value} (current bid)`
            : undefined,
        url: it.itemAffiliateWebUrl || it.itemWebUrl,
        source: 'eBay',
        sourceKind: 'resale',
        metadata: { condition: it.condition ?? null, itemId: it.itemId ?? null },
      };
    })
    .filter((c): c is RawCandidate => c !== null);
}