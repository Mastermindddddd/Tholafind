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
  Camera,
  Tag,
  ShoppingBag,
  RefreshCw,
  Search,
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
<section
  className="
    relative
    w-full
    overflow-hidden
    bg-paper
    py-6
    sm:py-8
    lg:py-10
  "
>
  {/* Paper texture */}
  <div className="pointer-events-none absolute inset-0 opacity-[0.35] paper-texture" />

  {/* Very subtle grid */}
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.025]"
    style={{
      backgroundImage:
        'linear-gradient(#1F3B33 1px, transparent 1px), linear-gradient(90deg, #1F3B33 1px, transparent 1px)',
      backgroundSize: '42px 42px',
    }}
  />

  {/* =====================================================
      DECORATIVE PRODUCT PHOTO — TOP LEFT
  ===================================================== */}

<div
  className="
    pointer-events-none absolute
    left-[-20px] top-3
    w-16
    rotate-[-8deg]
    rounded-sm bg-white p-1
    shadow-[0_6px_14px_rgba(0,0,0,0.12)]
    sm:left-[-25px] sm:top-5 sm:w-24 sm:p-1.5
    lg:left-8 lg:top-8 lg:w-52 lg:p-2
    lg:shadow-[0_12px_30px_rgba(0,0,0,0.12)]
  "
>
  <div className="aspect-[4/3] overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85"
      alt="Sneakers"
      className="h-full w-full object-cover"
    />
  </div>
</div>

  {/* Top-left handwritten note */}
 <div className="pointer-events-none absolute left-[10%] top-16 hidden rotate-[-8deg] sm:block lg:left-[18%] lg:top-20">
  <p className="font-display text-xs italic text-inkSoft sm:text-sm lg:text-lg">
    Just a photo...
  </p>
  <svg width="45" height="27" viewBox="0 0 75 45" className="ml-3 sm:ml-4 lg:ml-6 lg:w-[75px] lg:h-[45px]">
      <path
        d="M68 5C50 10 36 27 10 38"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M15 29L8 39L21 39"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>

{/* DECORATIVE PRODUCT PHOTO — LEFT */}
<div
  className="
    pointer-events-none absolute
    left-[-14px] top-20
    w-14
    rotate-[5deg]
    rounded-sm bg-white p-1
    shadow-[0_6px_14px_rgba(0,0,0,0.10)]
    sm:left-[-18px] sm:top-28 sm:w-20 sm:p-1.5
    lg:left-[-20px] lg:top-[38%] lg:w-44 lg:p-2
    lg:shadow-[0_12px_30px_rgba(0,0,0,0.10)]
    xl:left-12
  "
>
  <div className="aspect-[4/3] overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=85"
      alt="Camera"
      className="h-full w-full object-cover"
    />
  </div>
</div>

  {/* DECORATIVE PRODUCT PHOTO — BOTTOM LEFT */}
<div
  className="
    pointer-events-none absolute
    bottom-2 left-[3%]
    w-12
    rotate-[-5deg]
    rounded-sm bg-white p-1
    shadow-[0_6px_14px_rgba(0,0,0,0.10)]
    sm:w-16 sm:p-1.5
    xl:bottom-[-20px] xl:left-[7%] xl:w-40 xl:p-2
    xl:shadow-[0_12px_30px_rgba(0,0,0,0.10)]
  "
>
  <div className="aspect-[4/3] overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=85"
      alt="Jacket"
      className="h-full w-full object-cover"
    />
  </div>
</div>

  {/* =====================================================
      DECORATIVE PRODUCT PHOTO — TOP RIGHT
  ===================================================== */}

<div
  className="
    pointer-events-none absolute
    right-[-14px] top-3
    w-14
    rotate-[7deg]
    rounded-sm bg-white p-1
    shadow-[0_6px_14px_rgba(0,0,0,0.12)]
    sm:right-[-18px] sm:top-5 sm:w-20 sm:p-1.5
    lg:right-[-35px] lg:top-10 lg:w-52 lg:p-2
    lg:shadow-[0_12px_30px_rgba(0,0,0,0.12)]
    xl:right-8
  "
>
  <div className="aspect-[4/3] overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=700&q=85"
      alt="Chair"
      className="h-full w-full object-cover"
    />
  </div>
</div>

  {/* =====================================================
      RIGHT HANDWRITTEN NOTE
  ===================================================== */}
  <div
    className="
      pointer-events-none absolute
      right-[17%] top-[39%]
      hidden
      rotate-[5deg]
      lg:block
    "
  >
    <div className="flex items-start gap-2">
      <Search
        size={24}
        strokeWidth={1.5}
        className="mt-1 text-brick"
      />

      <p className="font-display text-lg italic leading-tight text-inkSoft">
        We search
        <br />
        everywhere.
      </p>
    </div>

    <svg
      width="90"
      height="45"
      viewBox="0 0 90 45"
      className="ml-2"
    >
      <path
        d="M8 5C25 15 45 30 82 35"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M72 27L83 35L69 38"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>

 {/* DECORATIVE PRODUCT PHOTO — RIGHT */}
<div
  className="
    pointer-events-none absolute
    right-[-14px] top-20
    w-14
    rotate-[-6deg]
    rounded-sm bg-white p-1
    shadow-[0_6px_14px_rgba(0,0,0,0.10)]
    sm:right-[-18px] sm:top-28 sm:w-20 sm:p-1.5
    lg:right-[-20px] lg:top-[40%] lg:w-44 lg:p-2
    lg:shadow-[0_12px_30px_rgba(0,0,0,0.10)]
    xl:right-12
  "
>
  <div className="aspect-[4/3] overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85"
      alt="Headphones"
      className="h-full w-full object-cover"
    />
  </div>
</div>

  {/* =====================================================
      MAIN CENTER CONTENT
  ===================================================== */}
  <div
  className="
    relative z-10
    mx-auto flex
    w-full max-w-4xl
    flex-col items-center
    justify-center
    px-5
    text-center
    sm:px-8
  "
>
  {/* Brand */}
<div className="font-display text-lg font-semibold tracking-[-0.04em] text-pine sm:text-xl md:text-2xl">
  Tholafind
</div>

{/* Small label */}
<div className="mt-1.5 flex items-center gap-1.5 sm:gap-2">
  <span className="h-px w-4 bg-pine/30 sm:w-5" />
  <span className="font-mono text-[0.46rem] uppercase tracking-[0.14em] text-inkSoft sm:text-[0.52rem] sm:tracking-[0.16em]">
    Find the things you can&apos;t find
  </span>
  <span className="h-px w-4 bg-pine/30 sm:w-5" />
</div>

{/* Main heading */}
<h1 className="mt-2 font-display text-[1.65rem] font-semibold leading-[1.08] tracking-[-0.035em] text-pine sm:text-4xl md:text-[2.9rem] lg:text-[3.3rem]">
  Snap it. <span className="italic text-brick">We&rsquo;ll find it.</span>
</h1>

{/* Hand-drawn underline */}
<div className="relative mt-1.5">
  <div className="h-[2.5px] w-24 rotate-[-1deg] rounded-full bg-brass sm:h-[3px] sm:w-44" />
  <span className="absolute -right-4 -top-2 text-sm text-brass sm:-right-5 sm:-top-2.5 sm:text-lg">✦</span>
</div>

{/* Description */}
<p className="mt-2.5 max-w-[38ch] text-[0.68rem] leading-[1.15rem] text-inkSoft sm:max-w-lg sm:text-[0.8rem] sm:leading-5 md:text-[0.85rem]">
  Upload a photo of anything you can&rsquo;t find, and we&rsquo;ll search retail, marketplaces
  and resale - with real people ready to help when the trail goes cold.
</p>

  {/* CENTERED UPLOAD */}
  <div className="relative mt-3 flex w-full justify-center sm:mt-4">
    <UploadDropzone />
  </div>

  {/* SEARCH SOURCES */}
  {/*<div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:mt-4 sm:gap-x-6">
  <div className="flex items-center gap-1 text-pine sm:gap-1.5">
    <Tag size={12} strokeWidth={1.5} className="sm:h-[13px] sm:w-[13px]" />
    <span className="font-mono text-[0.5rem] uppercase tracking-[0.06em] sm:text-[0.54rem] sm:tracking-[0.08em]">
      Retail
    </span>
  </div>
  <span className="hidden h-3.5 w-px bg-pine/20 sm:block" />
  <div className="flex items-center gap-1 text-pine sm:gap-1.5">
    <ShoppingBag size={12} strokeWidth={1.5} className="sm:h-[13px] sm:w-[13px]" />
    <span className="font-mono text-[0.5rem] uppercase tracking-[0.06em] sm:text-[0.54rem] sm:tracking-[0.08em]">
      Marketplaces
    </span>
  </div>
  <span className="hidden h-3.5 w-px bg-pine/20 sm:block" />
  <div className="flex items-center gap-1 text-pine sm:gap-1.5">
    <RefreshCw size={12} strokeWidth={1.5} className="sm:h-[13px] sm:w-[13px]" />
    <span className="font-mono text-[0.5rem] uppercase tracking-[0.06em] sm:text-[0.54rem] sm:tracking-[0.08em]">
      Resale
    </span>
  </div>
  <span className="hidden h-3.5 w-px bg-pine/20 sm:block" />
  <div className="flex items-center gap-1 text-pine sm:gap-1.5">
    <Users size={12} strokeWidth={1.5} className="sm:h-[13px] sm:w-[13px]" />
    <span className="font-mono text-[0.5rem] uppercase tracking-[0.06em] sm:text-[0.54rem] sm:tracking-[0.08em]">
      Finders
    </span>
  </div>
</div>*/}
</div>

  {/* =====================================================
      BOTTOM RIGHT DARK PAPER SHAPE
  ===================================================== */}
  <div
    className="
      pointer-events-none absolute
      -bottom-20 -right-20
      hidden
      h-40 w-80
      rotate-[-5deg]
      bg-pine
      lg:block
    "
  />

  <div
    className="
      pointer-events-none absolute
      bottom-5 right-10
      hidden
      rotate-[-5deg]
      lg:block
    "
  >
    <p className="font-display text-base italic text-paper">
      Real people.
      <br />
      Real finds.
    </p>

    <div className="mt-1 h-[3px] w-20 rotate-[-2deg] bg-brass" />
  </div>
</section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
  <div className="mb-9 max-w-xl sm:mb-12">
    <div className="flex items-center gap-2">
      {/*<span className="h-px w-5 bg-brick/40" />*/}
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-brick sm:text-[0.7rem]">
        How a hunt works
      </p>
    </div>

    <h2 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
      Three steps.{' '}
      <span className="relative italic text-pine">
        No dead ends.
        <span className="absolute -right-5 -top-3 text-sm text-brass sm:text-base">✦</span>
      </span>
    </h2>
  </div>

  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
    {steps.map((s, i) => (
      <div
        key={s.tag}
        className={`
          relative rounded-md border border-line bg-card p-5 shadow-card sm:p-6
          ${i % 2 === 0 ? 'rotate-[-0.6deg]' : 'rotate-[0.6deg]'}
          transition-transform hover:rotate-0
        `}
      >
        

        <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-brass sm:text-[0.65rem]">
          {s.tag}
        </p>

        <h3 className="mt-3 font-display text-lg font-semibold leading-tight text-ink sm:text-xl">
          {s.title}
        </h3>

        <p className="mt-2.5 text-[0.84rem] leading-relaxed text-inkSoft sm:text-[0.9rem]">
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
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-9 flex max-w-xl flex-col gap-1 sm:mb-12">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-brick sm:text-[0.7rem]">
          Why not just use Lens
        </p>
      </div>

      <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        Built for the searches that come up empty everywhere else.
      </h2>

      <p className="mt-1 font-display text-sm italic text-inkSoft sm:text-base">
        We&rsquo;ve been there too.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {features.map((f, i) => (
        <div
          key={f.title}
          className={`
            group relative overflow-hidden rounded-md border border-line bg-card p-5 sm:p-6
            ${i % 2 === 0 ? '-rotate-[0.4deg]' : 'rotate-[0.4deg]'}
            transition-all hover:-translate-y-0.5 hover:rotate-0 hover:shadow-card
          `}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine text-brassLight">
            <f.icon size={16} />
          </span>

          <h3 className="mt-4 font-display text-base font-semibold leading-tight text-ink sm:text-[1.05rem]">
            {f.title}
          </h3>

          <p className="mt-2 text-[0.82rem] leading-relaxed text-inkSoft sm:text-[0.85rem]">
            {f.body}
          </p>

          {/* subtle corner fold, like a worn card */}
          <span className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 bg-paperDim [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brassLight/30 bg-brassLight/5 px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-brassLight sm:text-[0.65rem] sm:tracking-[0.14em]">
  <span className="text-brassLight">✦</span> Coming soon
</span>

<h2 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight text-paper sm:text-3xl md:text-4xl lg:text-[2.7rem]">
  Your next hunt,
  <br className="hidden sm:block" />
  <span className="relative italic text-brassLight">
    in your pocket.
    <span className="absolute -bottom-1 left-0 h-[2px] w-full rotate-[-1deg] rounded-full bg-brassLight/50" />
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
            start a hunt in seconds, and keep searching even when you&apos;re
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
        {/*<p className="font-mono text-[0.48rem] uppercase tracking-wide text-paper/55">
          Coming soon on
        </p>*/}
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
        {/* <p className="font-mono text-[0.48rem] uppercase tracking-wide text-paper/55">
          Coming soon on
        </p>*/}
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
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
  <div className="grid grid-cols-1 gap-8 rounded-lg border border-line bg-card p-5 shadow-card sm:gap-10 sm:p-8 md:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:p-12">
    <div>
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-paperDim px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-inkSoft sm:text-[0.65rem] sm:tracking-[0.12em]">
        <ShieldCheck size={13} />
        No surprise paywalls
      </span>

      <h2 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        You see a real result before we ever ask for a card.
      </h2>

      <p className="mt-3 max-w-lg text-[0.85rem] leading-relaxed text-inkSoft sm:text-[0.92rem]">
        Every hunt starts free, and free means a real search across retail, resale, and vintage
        - not a locked screen after your first upload. Search itself is unlimited on every plan.
      </p>

      <p className="mt-2 font-display text-sm italic text-brick sm:text-base">
        Plus just removes the limits.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Free */}
      <div className="relative rotate-[-0.5deg] rounded-md border border-line bg-paper p-5 transition-transform hover:rotate-0">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-inkSoft">Free</p>
        <p className="mt-2 font-display text-2xl font-semibold text-ink">$0</p>

        <ul className="mt-4 space-y-2 text-[0.8rem] leading-relaxed text-inkSoft sm:text-[0.82rem]">
          <li>Unlimited photo searches</li>
          <li>Retail, resale &amp; vintage results</li>
          <li>3 collections</li>
          <li>2 community requests / month</li>
          <li>Watch 1 hunt for updates</li>
        </ul>
      </div>

      {/* Plus */}
      <div className="relative rotate-[0.5deg] rounded-md border border-brass bg-paper p-5 transition-transform hover:rotate-0">
        <span className="absolute -top-2.5 -right-2 text-base text-brass">✦</span>

        <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-brick">Plus</p>
        <p className="mt-2 font-display text-2xl font-semibold text-ink">
          $5<span className="text-sm font-normal text-inkSoft">/mo</span>
        </p>

        <ul className="mt-4 space-y-2 text-[0.8rem] leading-relaxed text-inkSoft sm:text-[0.82rem]">
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