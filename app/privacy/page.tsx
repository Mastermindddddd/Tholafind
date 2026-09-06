import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy — Tholafind',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">Legal</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[0.82rem] text-inkSoft">Last updated: 2026-09-06</p>

        <div className="mt-8 space-y-8 text-[0.92rem] leading-relaxed text-ink">
          <p>
            This Privacy Policy explains what information Tholafind collects, how we use it, and who
            we share it with. We&rsquo;ve tried to write it in plain language and keep it accurate
            to what the product actually does, rather than generic boilerplate.
          </p>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. Information we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Account information</strong> &mdash; your name and email address, collected
                when you sign up through our authentication provider.
              </li>
              <li>
                <strong>Photos you upload</strong> &mdash; the images you submit to search for an
                item, stored so you can revisit your search history.
              </li>
              <li>
                <strong>Search details</strong> &mdash; any text hints you add, your search history,
                saved collections, and the results returned for each search.
              </li>
              <li>
                <strong>Community content</strong> &mdash; requests you post asking for help
                identifying an item, and answers you submit to other people&rsquo;s requests.
              </li>
              <li>
                <strong>Payment information</strong> &mdash; if you subscribe to Plus, our payment
                processor collects your billing details directly. We receive confirmation that
                you&rsquo;re subscribed and basic subscription status, but never your full card
                number.
              </li>
              <li>
                <strong>Technical information</strong> &mdash; a hashed version of your IP address,
                used only to apply fair-use search limits and prevent abuse.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. How we use this information</h2>
            <p className="mt-2">We use the information above to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Run searches across retail, resale, and vintage sources on your behalf;</li>
              <li>Save your search history and collections so you can return to them later;</li>
              <li>Operate the community request/answer feature;</li>
              <li>Send you email updates when a hunt you&rsquo;re watching has a new listing or price drop;</li>
              <li>Process payments and manage your subscription;</li>
              <li>Maintain the security and reliability of the Service, including preventing abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Who we share information with</h2>
            <p className="mt-2">
              We use a number of third-party services to operate Tholafind. Each only receives the
              specific information it needs to do its job:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li><strong>Clerk</strong> &mdash; handles sign-up, sign-in, and account security.</li>
              <li><strong>MongoDB Atlas</strong> &mdash; stores your account, search, and collection data.</li>
              <li><strong>Vercel</strong> &mdash; hosts the app and stores your uploaded photos.</li>
              <li>
                <strong>Paddle</strong> &mdash; processes payments and acts as the merchant of record
                for Plus subscriptions.
              </li>
              <li>
                <strong>SerpApi and Replicate</strong> &mdash; receive your uploaded photo (as a URL)
                to perform visual product matching. This is the core mechanism that makes photo
                search work.
              </li>
              <li>
                <strong>eBay and Etsy</strong> &mdash; receive a text search query (not your photo)
                to find matching listings on their marketplaces.
              </li>
              <li><strong>Resend</strong> &mdash; delivers alert emails when you&rsquo;ve asked to be notified.</li>
              <li>
                <strong>eBay Partner Network / Awin</strong> &mdash; if you click through to an eBay
                or Etsy listing from Tholafind, these affiliate networks may log that click to
                attribute a commission to us, per their own privacy practices.
              </li>
            </ul>
            <p className="mt-2">
              We don&rsquo;t sell your personal information to third parties, and we don&rsquo;t
              share it with anyone beyond what&rsquo;s listed above except where required by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. Cookies</h2>
            <p className="mt-2">
              We use cookies set by our authentication provider to keep you signed in. We don&rsquo;t
              currently use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">5. Data retention</h2>
            <p className="mt-2">
              We keep your account, search, and collection data for as long as your account is
              active. If you delete your account, we delete your personal data within a reasonable
              period, except where we&rsquo;re required to retain certain records (for example,
              transaction records for tax or accounting purposes).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">6. Your rights</h2>
            <p className="mt-2">
              Depending on where you live, you may have the right to access, correct, export, or
              delete your personal information, or to object to certain uses of it. To exercise any
              of these rights, contact us at{' '}
              <a href="mailto:[SUPPORT EMAIL]" className="text-brick underline">
                [SUPPORT EMAIL]
              </a>
              , and we&rsquo;ll respond within a reasonable time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">7. Children&rsquo;s privacy</h2>
            <p className="mt-2">
              Tholafind isn&rsquo;t directed at children, and we don&rsquo;t knowingly collect
              personal information from anyone under 16. If you believe a child has provided us with
              personal information, contact us and we&rsquo;ll remove it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">8. International data transfers</h2>
            <p className="mt-2">
              The services listed in Section 3 operate data centers in multiple countries, which
              means your information may be processed outside the country you live in. Where
              required, we rely on standard contractual safeguards to protect data transferred
              internationally.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">9. Security</h2>
            <p className="mt-2">
              We use reasonable technical and organizational measures to protect your information,
              including relying on established providers (listed above) for authentication, hosting,
              and payments rather than handling sensitive data ourselves wherever possible. No method
              of transmission or storage is 100% secure, and we can&rsquo;t guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">10. Changes to this policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. Material changes will be posted
              here with an updated &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">11. Contact</h2>
            <p className="mt-2">
              Questions about this policy or your data? Reach us at{' '}
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