import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UploadDropzone from '@/components/UploadDropzone';
import UpgradeButton from '@/components/UpgradeButton';
import { Users, Layers, ImageOff, FolderOpen, ShieldCheck } from 'lucide-react';

const steps = [
  {
    tag: 'Specimen 01',
    title: 'Log it',
    body: 'Snap it, screenshot it, or drop a photo you already have. Add a hint if you know one \u2014 a color, a material, a brand guess.',
  },
  {
    tag: 'Specimen 02',
    title: 'We search everywhere at once',
    body: 'Retail, marketplaces, and resale sites are checked together \u2014 not just one catalog \u2014 so you\u2019re not stuck if it\u2019s not sold where you started.',
  },
  {
    tag: 'Specimen 03',
    title: 'Stuck? Ask the finders',
    body: 'When the trail goes cold, hand it to people who are good at this. No dead ends, just a different kind of search.',
  },
];

const features = [
  {
    icon: Layers,
    title: 'Every source, one search',
    body: 'No more starting over in five different apps. Retail, resale, and vintage results sit in the same grid, so a dead end on one site isn\u2019t a dead end for the hunt.',
  },
  {
    icon: ImageOff,
    title: 'Built for bad photos',
    body: 'Blurry, cropped, low light, no tag \u2014 that\u2019s the norm, not the exception. When we\u2019re unsure, we say so, and ask for the detail that would help.',
  },
  {
    icon: Users,
    title: 'A crowd for the hard cases',
    body: 'Some things only a person will recognize. Escalate a stubborn search to the community, with the same structured detail that gets real answers.',
  },
  {
    icon: FolderOpen,
    title: 'Hunts you can leave and return to',
    body: 'Every search is saved automatically, and you can watch any hunt for updates \u2014 we\u2019ll check daily and tell you about a new listing or a price drop. Come back in a month and pick up exactly where you left off.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-pine">
        <div className="paper-texture absolute inset-0 opacity-[0.06]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:flex-row lg:items-center lg:justify-between lg:py-32">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-block rounded-full border border-brassLight/40 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-brassLight">
              A field guide for things you can&rsquo;t name yet
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-5xl lg:text-[3.4rem]">
              You saw it once.
              <br />
              <span className="italic text-brassLight">We&rsquo;ll help you find it again.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-[1.02rem] leading-relaxed text-paper/75 lg:mx-0">
              Tholafind turns a photo into a search across retail, resale, and vintage sources at once
              &mdash; and calls in real people when the algorithm runs out of ideas.
            </p>
          </div>

          <UploadDropzone />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-12 max-w-xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-brick">How a hunt works</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            Three steps. No dead ends.
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.tag} className="rounded-md border border-line bg-card p-6 shadow-card">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-brass">{s.tag}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-2.5 text-[0.9rem] leading-relaxed text-inkSoft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-paperDim py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-12 max-w-xl">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-brick">Why not just use Lens</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
              Built for the searches that come up empty everywhere else.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-md border border-line bg-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine text-brassLight">
                  <f.icon size={16} />
                </span>
                <h3 className="mt-4 font-display text-[1.05rem] font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-[0.85rem] leading-relaxed text-inkSoft">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest pricing */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 rounded-lg border border-line bg-card p-8 shadow-card sm:p-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paperDim px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-inkSoft">
              <ShieldCheck size={13} /> No surprise paywalls
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              You see a real result before we ever ask for a card.
            </h2>
            <p className="mt-3 max-w-lg text-[0.92rem] leading-relaxed text-inkSoft">
              Every hunt starts free, and free means a real search across retail, resale, and vintage
              &mdash; not a locked screen after your first upload. Search itself is unlimited on every
              plan. Plus removes the two limits that exist on Free: how many collections you can
              keep, and how many times a month you can ask the community for help.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-line bg-paper p-5">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-inkSoft">Free</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">$0</p>
              <ul className="mt-4 space-y-2 text-[0.82rem] text-inkSoft">
                <li>Unlimited photo searches</li>
                <li>Retail, resale &amp; vintage results</li>
                <li>3 collections</li>
                <li>2 community requests / month</li>
              </ul>
            </div>
            <div className="rounded-md border border-brass bg-paper p-5">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-brick">Plus</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">$5<span className="text-sm font-normal text-inkSoft">/mo</span></p>
              <ul className="mt-4 space-y-2 text-[0.82rem] text-inkSoft">
                <li>Unlimited collections</li>
                <li>Unlimited community requests</li>
              </ul>
              <div className="mt-4">
                <UpgradeButton label="Get Plus" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}