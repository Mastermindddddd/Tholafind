import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service — Tholafind',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">Legal</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-[0.82rem] text-inkSoft">Last updated: 2026-09-06</p>

        <div className="prose-legal mt-8 space-y-8 text-[0.92rem] leading-relaxed text-ink">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Tholafind
            (&ldquo;Tholafind,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
            including our website, apps, and related services (together, the &ldquo;Service&rdquo;).
            By creating an account or using the Service, you agree to these Terms. If you don&rsquo;t
            agree, please don&rsquo;t use the Service.
          </p>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. What Tholafind does</h2>
            <p className="mt-2">
              Tholafind lets you upload a photo of an item and searches retail, resale, and vintage
              marketplaces to help you find it or something similar. We show results with a
              confidence indicator, let you save results into collections, ask other users for help
              identifying hard-to-find items, and optionally watch a search for price drops or new
              listings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. Eligibility and accounts</h2>
            <p className="mt-2">
              You must be at least 18 years old (or the age of legal majority where you live) to
              create an account or make a purchase. You&rsquo;re responsible for keeping your account
              credentials secure and for all activity under your account. Account creation and
              sign-in are handled by our authentication provider; you agree to their applicable
              terms as part of using our sign-in flow.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Plans, billing, and cancellation</h2>
            <p className="mt-2">
              Tholafind offers a Free plan and a paid Plus plan. Free accounts can search without
              limit, keep up to 3 collections, make up to 2 community requests per month, and watch
              1 hunt for updates at a time. Plus removes those specific limits for a recurring
              monthly fee shown at checkout.
            </p>
            <p className="mt-2">
              Payments are processed by Paddle.com Market Limited, acting as our Merchant of Record.
              Paddle handles billing, invoicing, tax collection where applicable, and payment
              security for all paid transactions &mdash; Tholafind never receives or stores your
              full card details. Your purchase is subject to{' '}
              <a href="https://www.paddle.com/legal/checkout-buyer-terms" className="text-brick underline">
                Paddle&rsquo;s Buyer Terms
              </a>{' '}
              in addition to these Terms.
            </p>
            <p className="mt-2">
              Plus subscriptions renew automatically each billing period until you cancel. You can
              cancel anytime from your account page; your Plus access continues until the end of the
              period you&rsquo;ve already paid for, and you won&rsquo;t be charged again after that.
              See our <a href="/refund-policy" className="text-brick underline">Refund Policy</a> for
              how refunds are handled.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. Your content</h2>
            <p className="mt-2">
              You keep ownership of the photos, hints, and other content you submit
              (&ldquo;Your Content&rdquo;). By submitting it, you give us a license to store,
              process, and display it as needed to operate the Service &mdash; for example, sending
              your photo to third-party search providers to find matching products, or showing your
              saved collections back to you.
            </p>
            <p className="mt-2">
              Don&rsquo;t upload content you don&rsquo;t have the right to share, or that&rsquo;s
              illegal, infringing, or depicts anyone without their consent.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">5. Community requests and answers</h2>
            <p className="mt-2">
              When a search comes back uncertain, you can ask the Tholafind community for help, and
              other users can respond with links and notes. Community answers are submitted by other
              users, not verified by Tholafind, and may be incomplete, wrong, or unhelpful. Treat
              them as a lead, not a guarantee. Be respectful when submitting or responding to
              requests &mdash; we may remove content or suspend accounts for harassment, spam, or
              abuse of this feature.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">6. Third-party listings, links, and affiliate relationships</h2>
            <p className="mt-2">
              Search results link out to listings on third-party sites (including eBay, Etsy, and
              various retailers). Those sites, not Tholafind, are responsible for the accuracy of
              prices, availability, item condition, shipping, and the transaction itself if you
              choose to buy something. We don&rsquo;t control or guarantee anything about a
              third-party listing once you leave Tholafind.
            </p>
            <p className="mt-2">
              Some outbound links may be affiliate links. If you make a purchase after clicking one,
              Tholafind may earn a commission from the retailer or marketplace, at no extra cost to
              you. This doesn&rsquo;t affect which results we show you or how they&rsquo;re ranked.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">7. Search results aren&rsquo;t guaranteed</h2>
            <p className="mt-2">
              Tholafind uses automated visual and text-based matching to find results, and shows a
              confidence level (exact, close, or best guess) with each one. Even &ldquo;exact&rdquo;
              matches are algorithmic estimates, not verified facts &mdash; results can be wrong,
              outdated, or unavailable by the time you view them. Don&rsquo;t rely on Tholafind as
              your only source before making a purchase decision.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">8. Acceptable use</h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Use the Service for anything illegal, or to search for illegal or prohibited items;</li>
              <li>Attempt to scrape, reverse-engineer, or circumvent rate limits or security measures;</li>
              <li>Upload malware, spam, or content that infringes someone else&rsquo;s rights;</li>
              <li>Impersonate another person or misuse another person&rsquo;s account;</li>
              <li>Use the community feature to harass, deceive, or advertise unrelated products or services.</li>
            </ul>
            <p className="mt-2">
              We may enforce fair-use limits on searches to protect the Service from abuse; this
              isn&rsquo;t intended to affect normal, personal use of the product.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">9. Intellectual property</h2>
            <p className="mt-2">
              Tholafind&rsquo;s name, logo, design, and software are owned by us or our licensors and
              protected by intellectual property law. These Terms don&rsquo;t grant you any rights
              to our trademarks or branding beyond what&rsquo;s necessary to use the Service
              normally.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">10. Disclaimers and limitation of liability</h2>
            <p className="mt-2">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or
              implied, including fitness for a particular purpose or accuracy of results. To the
              fullest extent permitted by law, Tholafind isn&rsquo;t liable for indirect,
              incidental, or consequential damages arising from your use of the Service, or for any
              transaction you complete on a third-party site linked from our results. Nothing in
              these Terms limits liability that can&rsquo;t be excluded under applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">11. Termination</h2>
            <p className="mt-2">
              You can stop using the Service and delete your account at any time. We may suspend or
              terminate accounts that violate these Terms, with notice where reasonably possible.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">12. Changes to these Terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. If we make material changes, we&rsquo;ll
              post the updated Terms here with a new &ldquo;Last updated&rdquo; date. Continuing to
              use the Service after changes take effect means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">13. Governing law</h2>
            <p className="mt-2">
              These Terms are governed by the laws of [JURISDICTION], without regard to conflict-of-law
              principles, except where local consumer protection law requires otherwise for your
              purchase.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">14. Contact</h2>
            <p className="mt-2">
              Questions about these Terms? Reach us at{' '}
              <a href="mailto:[SUPPORT EMAIL]" className="text-brick underline">
                [SUPPORT EMAIL]
              </a>
              .
            </p>
          </section>
        </div>
      </section>

      <Footer />
    </div>
  );
}