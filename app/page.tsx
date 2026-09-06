import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UploadDropzone from '@/components/UploadDropzone';
import UpgradeButton from '@/components/UpgradeButton';
import {
  Users,
  Layers,
  ImageOff,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';

const steps = [
  {
    tag: 'Specimen 01',
    title: 'Log it',
    body: 'Snap it, screenshot it, or drop a photo you already have. Add a hint if you know one — a color, a material, a brand guess.',
  },
  {
    tag: 'Specimen 02',
    title: 'We search everywhere at once',
    body: 'Retail, marketplaces, and resale sites are checked together — not just one catalog — so you’re not stuck if it’s not sold where you started.',
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
    body: 'No more starting over in five different apps. Retail, resale, and vintage results sit in the same grid, so a dead end on one site isn’t a dead end for the hunt.',
  },
  {
    icon: ImageOff,
    title: 'Built for bad photos',
    body: 'Blurry, cropped, low light, no tag — that’s the norm, not the exception. When we’re unsure, we say so, and ask for the detail that would help.',
  },
  {
    icon: Users,
    title: 'A crowd for the hard cases',
    body: 'Some things only a person will recognize. Escalate a stubborn search to the community, with the same structured detail that gets real answers.',
  },
  {
    icon: FolderOpen,
    title: 'Hunts you can leave and return to',
    body: 'Every search is saved automatically, and you can watch a hunt for updates — we’ll check daily and tell you about a new listing or a price drop. Come back in a month and pick up exactly where you left off.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-paper paper-texture">
      <Navbar />

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden bg-pine">
        <div className="paper-texture absolute inset-0 opacity-[0.06]" />

        <div
          className="
            relative mx-auto flex w-full max-w-7xl
            flex-col items-center
            gap-10
            px-4 py-14
            sm:px-6 sm:py-20
            md:gap-12 md:py-24
            lg:flex-row lg:items-center lg:justify-between
            lg:gap-16 lg:px-8 lg:py-28
            xl:py-32
          "
        >
          {/* Hero Text */}
          <div
            className="
              w-full max-w-2xl
              text-center
              lg:max-w-xl lg:text-left
            "
          >
            <span
              className="
                inline-block max-w-full
                rounded-full
                border border-brassLight/40
                px-3 py-1.5
                font-mono text-[0.58rem]
                uppercase tracking-[0.12em]
                leading-relaxed
                text-brassLight
                sm:text-[0.65rem]
                sm:tracking-[0.14em]
              "
            >
              A field guide for things you can&rsquo;t name yet
            </span>

            <h1
              className="
                mt-5
                font-display
                text-[2.15rem]
                font-semibold
                leading-[1.08]
                tracking-tight
                text-paper
                sm:text-4xl
                md:text-5xl
                lg:text-[3.4rem]
              "
            >
              You saw it once.
              <br />
              <span className="italic text-brassLight">
                We&rsquo;ll help you find it again.
              </span>
            </h1>

            <p
              className="
                mx-auto mt-5
                w-full max-w-md
                text-[0.92rem]
                leading-relaxed
                text-paper/75
                sm:text-[1.02rem]
                lg:mx-0
              "
            >
              Tholafind turns a photo into a search across retail, resale,
              and vintage sources at once &mdash; and calls in real people
              when the algorithm runs out of ideas.
            </p>
          </div>

          {/* Upload */}
          <div className="w-full max-w-xl lg:max-w-[520px]">
            <UploadDropzone />
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}
      <section
        className="
          mx-auto w-full max-w-7xl
          px-4 py-14
          sm:px-6 sm:py-20
          lg:px-8 lg:py-24
        "
      >
        <div className="mb-9 max-w-xl sm:mb-12">
          <p
            className="
              font-mono text-[0.62rem]
              uppercase tracking-[0.14em]
              text-brick
              sm:text-[0.7rem]
            "
          >
            How a hunt works
          </p>

          <h2
            className="
              mt-3
              font-display
              text-2xl
              font-semibold
              leading-tight
              tracking-tight
              text-ink
              sm:text-3xl
            "
          >
            Three steps. No dead ends.
          </h2>
        </div>

        <div
          className="
            grid grid-cols-1 gap-5
            md:grid-cols-2
            lg:grid-cols-3 lg:gap-8
          "
        >
          {steps.map((s) => (
            <div
              key={s.tag}
              className="
                rounded-md
                border border-line
                bg-card
                p-5
                shadow-card
                sm:p-6
              "
            >
              <p
                className="
                  font-mono
                  text-[0.6rem]
                  uppercase
                  tracking-[0.12em]
                  text-brass
                  sm:text-[0.65rem]
                "
              >
                {s.tag}
              </p>

              <h3
                className="
                  mt-3
                  font-display
                  text-lg
                  font-semibold
                  leading-tight
                  text-ink
                  sm:text-xl
                "
              >
                {s.title}
              </h3>

              <p
                className="
                  mt-2.5
                  text-[0.84rem]
                  leading-relaxed
                  text-inkSoft
                  sm:text-[0.9rem]
                "
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}
      <section className="w-full bg-paperDim py-14 sm:py-20 lg:py-24">
        <div
          className="
            mx-auto w-full max-w-7xl
            px-4
            sm:px-6
            lg:px-8
          "
        >
          <div className="mb-9 max-w-xl sm:mb-12">
            <p
              className="
                font-mono text-[0.62rem]
                uppercase tracking-[0.14em]
                text-brick
                sm:text-[0.7rem]
              "
            >
              Why not just use Lens
            </p>

            <h2
              className="
                mt-3
                font-display
                text-2xl
                font-semibold
                leading-tight
                tracking-tight
                text-ink
                sm:text-3xl
              "
            >
              Built for the searches that come up empty everywhere else.
            </h2>
          </div>

          <div
            className="
              grid grid-cols-1 gap-5
              sm:grid-cols-2
              lg:grid-cols-4 lg:gap-6
            "
          >
            {features.map((f) => (
              <div
                key={f.title}
                className="
                  rounded-md
                  border border-line
                  bg-card
                  p-5
                  sm:p-6
                "
              >
                <span
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-full
                    bg-pine
                    text-brassLight
                  "
                >
                  <f.icon size={16} />
                </span>

                <h3
                  className="
                    mt-4
                    font-display
                    text-base
                    font-semibold
                    leading-tight
                    text-ink
                    sm:text-[1.05rem]
                  "
                >
                  {f.title}
                </h3>

                <p
                  className="
                    mt-2
                    text-[0.82rem]
                    leading-relaxed
                    text-inkSoft
                    sm:text-[0.85rem]
                  "
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================= */}
      <section
        className="
          mx-auto w-full max-w-7xl
          px-4 py-14
          sm:px-6 sm:py-20
          lg:px-8 lg:py-24
        "
      >
        <div
          className="
            grid
            grid-cols-1
            gap-8
            rounded-lg
            border border-line
            bg-card
            p-5
            shadow-card
            sm:gap-10 sm:p-8
            md:p-10
            lg:grid-cols-[1.1fr_1fr]
            lg:items-center
            lg:p-12
          "
        >
          {/* Pricing Description */}
          <div>
            <span
              className="
                inline-flex
                max-w-full
                items-center
                gap-1.5
                rounded-full
                bg-paperDim
                px-3 py-1
                font-mono
                text-[0.58rem]
                uppercase
                tracking-[0.1em]
                text-inkSoft
                sm:text-[0.65rem]
                sm:tracking-[0.12em]
              "
            >
              <ShieldCheck size={13} />
              No surprise paywalls
            </span>

            <h2
              className="
                mt-4
                font-display
                text-2xl
                font-semibold
                leading-tight
                tracking-tight
                text-ink
                sm:text-3xl
              "
            >
              You see a real result before we ever ask for a card.
            </h2>

            <p
              className="
                mt-3
                max-w-lg
                text-[0.85rem]
                leading-relaxed
                text-inkSoft
                sm:text-[0.92rem]
              "
            >
              Every hunt starts free, and free means a real search across
              retail, resale, and vintage &mdash; not a locked screen after
              your first upload. Search itself is unlimited on every plan.
              Plus removes the limits that exist on Free: how many
              collections you can keep, how many times a month you can ask
              the community for help, and how many hunts you can watch for
              updates at once.
            </p>
          </div>

          {/* Pricing Cards */}
          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
            "
          >
            {/* Free */}
            <div
              className="
                rounded-md
                border border-line
                bg-paper
                p-5
              "
            >
              <p
                className="
                  font-mono
                  text-[0.6rem]
                  uppercase
                  tracking-[0.12em]
                  text-inkSoft
                "
              >
                Free
              </p>

              <p
                className="
                  mt-2
                  font-display
                  text-2xl
                  font-semibold
                  text-ink
                "
              >
                $0
              </p>

              <ul
                className="
                  mt-4
                  space-y-2
                  text-[0.8rem]
                  leading-relaxed
                  text-inkSoft
                  sm:text-[0.82rem]
                "
              >
                <li>Unlimited photo searches</li>
                <li>Retail, resale &amp; vintage results</li>
                <li>3 collections</li>
                <li>2 community requests / month</li>
                <li>Watch 1 hunt for updates</li>
              </ul>
            </div>

            {/* Plus */}
            <div
              className="
                rounded-md
                border border-brass
                bg-paper
                p-5
              "
            >
              <p
                className="
                  font-mono
                  text-[0.6rem]
                  uppercase
                  tracking-[0.12em]
                  text-brick
                "
              >
                Plus
              </p>

              <p
                className="
                  mt-2
                  font-display
                  text-2xl
                  font-semibold
                  text-ink
                "
              >
                $5
                <span
                  className="
                    text-sm
                    font-normal
                    text-inkSoft
                  "
                >
                  /mo
                </span>
              </p>

              <ul
                className="
                  mt-4
                  space-y-2
                  text-[0.8rem]
                  leading-relaxed
                  text-inkSoft
                  sm:text-[0.82rem]
                "
              >
                <li>Unlimited collections</li>
                <li>Unlimited community requests</li>
                <li>Watch unlimited hunts for updates</li>
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