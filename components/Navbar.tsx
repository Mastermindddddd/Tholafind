'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

// "Latest hunt" is removed until Phase 5 gives us a real per-user search
// history to point it at — a static /results link isn't meaningful anymore
// now that every hunt has its own /results/[searchId] page.
const links = [
  { href: '/', label: 'Search' },
  { href: '/collections', label: 'Collections' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine text-brassLight">
            <Compass size={17} strokeWidth={2} />
          </span>
          <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
            Tholafind
          </span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`font-mono text-[0.72rem] uppercase tracking-[0.14em] transition-colors ${
                  active ? 'text-brick' : 'text-inkSoft hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/onboarding">
              <button className="rounded-full border border-line px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-inkSoft transition-colors hover:border-pine hover:text-ink">
                Sign in
              </button>
            </SignInButton>
            <Link
              href="/"
              className="rounded-full bg-pine px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-pineDeep"
            >
              Start a hunt
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/"
              className="rounded-full bg-pine px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-pineDeep"
            >
              Start a hunt
            </Link>
            <UserButton
              appearance={{
                elements: { avatarBox: 'h-8 w-8' },
                variables: { colorPrimary: '#1F3B33' },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}