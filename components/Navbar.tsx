'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CreditCard, Menu, X } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';

// Navigation links
const links = [
  { href: '/', label: 'Search' },
  { href: '/collections', label: 'Collections' },
  { href: '/community', label: 'Community' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine text-brassLight">
            <Compass size={17} strokeWidth={2} />
          </span>

          <span className="font-display text-[1.25rem] font-semibold tracking-tight text-ink sm:text-[1.35rem]">
            Tholafind
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          {links.map((l) => {
            const active =
              l.href === '/'
                ? pathname === '/'
                : pathname === l.href || pathname.startsWith(`${l.href}/`);

            return (
              <Link
                key={l.href}
                href={l.href}
                className={`font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors lg:text-[0.72rem] ${
                  active
                    ? 'text-brick'
                    : 'text-inkSoft hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <SignedOut>
            {/* Desktop / Tablet Sign In */}
            <div className="hidden sm:block">
              <SignInButton
                forceRedirectUrl="/onboarding"
                signUpForceRedirectUrl="/onboarding"
              >
                <button className="rounded-full border border-line px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-inkSoft transition-colors hover:border-pine hover:text-ink sm:text-[0.72rem]">
                  Sign in
                </button>
              </SignInButton>
            </div>

            {/* Start Hunt */}
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="rounded-full bg-pine px-3.5 py-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-pineDeep sm:px-4 sm:text-[0.72rem] sm:tracking-[0.12em]"
            >
              Start a hunt
            </Link>
          </SignedOut>

          <SignedIn>
            {/* Start Hunt */}
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="rounded-full bg-pine px-3.5 py-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-pineDeep sm:px-4 sm:text-[0.72rem] sm:tracking-[0.12em]"
            >
              Start a hunt
            </Link>

            {/* User */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
                variables: {
                  colorPrimary: '#1F3B33',
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Account & billing"
                  labelIcon={<CreditCard size={14} />}
                  href="/account"
                />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-pine hover:text-pine md:hidden"
          >
            {mobileMenuOpen ? (
              <X size={19} strokeWidth={2} />
            ) : (
              <Menu size={19} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`border-t border-line/70 bg-paper transition-all duration-200 md:hidden ${
          mobileMenuOpen
            ? 'max-h-96 opacity-100'
            : 'pointer-events-none max-h-0 overflow-hidden opacity-0'
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col">
            {links.map((l) => {
              const active =
                l.href === '/'
                  ? pathname === '/'
                  : pathname === l.href ||
                    pathname.startsWith(`${l.href}/`);

              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeMobileMenu}
                  className={`border-b border-line/50 py-4 font-mono text-[0.72rem] uppercase tracking-[0.14em] transition-colors last:border-b-0 ${
                    active
                      ? 'text-brick'
                      : 'text-inkSoft hover:text-ink'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}

            {/* Mobile Sign In */}
            <SignedOut>
              <div className="pt-3">
                <SignInButton
                  forceRedirectUrl="/onboarding"
                  signUpForceRedirectUrl="/onboarding"
                >
                  <button
                    onClick={closeMobileMenu}
                    className="w-full rounded-full border border-line px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-inkSoft transition-colors hover:border-pine hover:text-ink"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </div>
            </SignedOut>
          </div>
        </nav>
      </div>
    </header>
  );
}