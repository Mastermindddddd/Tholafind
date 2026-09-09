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
    body: 'Snap it, screenshot it, or drop a photo you already have. Add a hint if you know one - a color, a material, a brand guess.',
  },
  {
    tag: 'Specimen 02',
    title: 'We search everywhere at once',
    body: 'Retail, marketplaces, and resale sites are checked together - not just one catalog - so you’re not stuck if it’s not sold where you started.',
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
    body: 'Blurry, cropped, low light, no tag - that’s the norm, not the exception. When we’re unsure, we say so, and ask for the detail that would help.',
  },
  {
    icon: Users,
    title: 'A crowd for the hard cases',
    body: 'Some things only a person will recognize. Escalate a stubborn search to the community, with the same structured detail that gets real answers.',
  },
  {
    icon: FolderOpen,
    title: 'Hunts you can leave and return to',
    body: 'Every search is saved automatically, and you can watch a hunt for updates - we’ll check daily and tell you about a new listing or a price drop. Come back in a month and pick up exactly where you left off.',
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
              and vintage sources at once and calls in real people
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
    MOBILE APP — COMING SOON
========================================================= */}
<section className="w-full px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
  <div className="mx-auto w-full max-w-7xl">
    <div
      className="
        relative overflow-hidden rounded-lg
        border border-line
        bg-pine
        px-5 py-8
        shadow-card
        sm:px-8 sm:py-10
        md:px-10 md:py-12
        lg:px-14 lg:py-14
      "
    >
      {/* Subtle texture */}
      <div className="paper-texture absolute inset-0 opacity-[0.06]" />

      {/* Decorative circles */}
      <div
        className="
          pointer-events-none absolute
          -right-20 -top-20
          h-48 w-48 rounded-full
          border border-brassLight/10
          sm:h-64 sm:w-64
        "
      />

      <div
        className="
          pointer-events-none absolute
          -bottom-24 -left-20
          h-48 w-48 rounded-full
          border border-brassLight/10
          sm:h-64 sm:w-64
        "
      />

      <div
        className="
          relative z-10
          flex flex-col
          items-center
          gap-8
          text-center
          lg:flex-row
          lg:justify-between
          lg:gap-12
          lg:text-left
        "
      >
        {/* Text */}
        <div className="w-full max-w-2xl">
          <span
            className="
              inline-flex
              items-center
              rounded-full
              border border-brassLight/30
              bg-brassLight/5
              px-3 py-1.5
              font-mono
              text-[0.58rem]
              uppercase
              tracking-[0.12em]
              text-brassLight
              sm:text-[0.65rem]
              sm:tracking-[0.14em]
            "
          >
            Coming soon
          </span>

          <h2
            className="
              mt-4
              font-display
              text-2xl
              font-semibold
              leading-tight
              tracking-tight
              text-paper
              sm:text-3xl
              md:text-4xl
              lg:text-[2.7rem]
            "
          >
            Your next hunt,
            <br className="hidden sm:block" />
            <span className="italic text-brassLight">
              in your pocket.
            </span>
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-xl
              text-[0.88rem]
              leading-relaxed
              text-paper/70
              sm:text-[0.95rem]
              lg:mx-0
            "
          >
            Tholafind is coming to mobile. Snap something wherever you are,
            start a hunt in seconds, and keep searching even when you're
            away from your desk.
          </p>
        </div>

{/* App Store / Google Play Badges */}
<div
  className="
    flex w-full max-w-md
    flex-col items-center
    gap-5
    lg:w-auto lg:max-w-sm
    lg:shrink-0
  "
>
  
  {/* Coming Soon */}
  <div className="text-center">
    <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-paper/50">
      Coming soon
    </p>

    <p className="mt-1 font-display text-sm font-medium text-paper sm:text-base">
      Tholafind on mobile
    </p>
  </div>

  {/* Store Badges */}
  <div
    className="
      flex w-full
      flex-col
      items-center
      justify-center
      gap-3
      sm:flex-row
    "
  >
    {/* App Store */}
    <div
      className="
        flex w-full max-w-[190px]
        items-center gap-3
        rounded-xl
        border border-paper/15
        bg-black/20
        px-4 py-2.5
        opacity-90
        transition
        hover:bg-black/30
      "
    >
      {/* Apple Logo */}
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 shrink-0 fill-paper"
        aria-hidden="true"
      >
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.1.8 1.21-.25 2.37-.93 3.66-.84 1.55.13 2.72.74 3.5 1.8-3.2 1.92-2.44 6.13.5 7.9-.59 1.55-1.36 3.08-2.76 4.27zM12.05 7.25C11.9 4.94 13.77 3.05 15.92 2.9c.3 2.66-2.4 4.64-3.87 4.35z" />
      </svg>

      <div className="text-left leading-none">
        <p className="font-mono text-[0.48rem] uppercase tracking-wide text-paper/55">
          Coming soon on
        </p>
        <p className="mt-1 font-display text-sm font-medium text-paper">
          App Store
        </p>
      </div>
    </div>

    {/* Google Play */}
    <div
      className="
        flex w-full max-w-[190px]
        items-center gap-3
        rounded-xl
        border border-paper/15
        bg-black/20
        px-4 py-2.5
        opacity-90
        transition
        hover:bg-black/30
      "
    >
      {/* Google Play Logo */}
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 shrink-0"
        aria-hidden="true"
      >
        <path
          fill="#34A853"
          d="M2.5 3.4c-.31.33-.5.84-.5 1.5v14.2c0 .66.19 1.17.5 1.5l.08.08L13.2 12.1v-.2L2.58 3.32l-.08.08z"
        />
        <path
          fill="#4285F4"
          d="m16.72 15.62-3.52-3.52v-.2l3.52-3.52.08.05 4.17 2.37c1.19.68 1.19 1.78 0 2.46l-4.17 2.37-.08-.01z"
        />
        <path
          fill="#FBBC04"
          d="M16.8 15.57 13.2 12 2.5 20.6c.42.45 1.1.5 1.86.07l12.44-7.07z"
        />
        <path
          fill="#EA4335"
          d="M16.8 8.43 4.36 1.36C3.6.93 2.92.98 2.5 1.43L13.2 10l3.6-1.57z"
        />
      </svg>

      <div className="text-left leading-none">
        <p className="font-mono text-[0.48rem] uppercase tracking-wide text-paper/55">
          Coming soon on
        </p>
        <p className="mt-1 font-display text-sm font-medium text-paper">
          Google Play
        </p>
      </div>
    </div>
  </div>
</div>

      </div>
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
              retail, resale, and vintage - not a locked screen after
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