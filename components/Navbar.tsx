'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CreditCard, Menu, X } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';

const links = [
  { href: '/', label: 'Search' },
  { href: '/collections', label: 'Collections' },
  { href: '/browse', label: 'Browse' },
  { href: '/community', label: 'Community' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Prevent the page from scrolling while the sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close sidebar when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* =========================================================
          NAVBAR
      ========================================================= */}
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

          {/* =====================================================
              DESKTOP NAVIGATION
          ===================================================== */}
          <nav className="hidden items-center gap-6 md:flex lg:gap-8">
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

          {/* =====================================================
              RIGHT SIDE ACTIONS
          ===================================================== */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Signed Out */}
            <SignedOut>
              {/* Desktop Sign In */}
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
            </SignedOut>

            {/* Signed In */}
            <SignedIn>
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

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================= */}
            <button
              type="button"
              aria-label={
                mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
              }
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-full
                border border-line
                text-ink
                transition-all
                duration-200
                hover:border-pine
                hover:text-pine
                md:hidden
              "
            >
              {mobileMenuOpen ? (
                <X size={20} strokeWidth={2} />
              ) : (
                <Menu size={20} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          MOBILE SIDEBAR + BACKDROP
      ========================================================= */}

      {/* Backdrop */}
      <div
        onClick={closeMobileMenu}
        className={`
          fixed inset-0 z-40
          bg-black/30
          backdrop-blur-[2px]
          transition-opacity duration-300
          md:hidden
          ${
            mobileMenuOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }
        `}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed right-0 top-0 z-50
          flex h-full
          w-[min(85vw,380px)]
          flex-col
          bg-paper
          shadow-2xl
          transition-transform
          duration-300
          ease-out
          md:hidden
          ${
            mobileMenuOpen
              ? 'translate-x-0'
              : 'translate-x-full'
          }
        `}
        aria-hidden={!mobileMenuOpen}
      >

        {/* Sidebar Header */}
        <div className="flex min-h-[72px] items-center justify-between border-b border-line/70 px-5">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine text-brassLight">
              <Compass size={17} strokeWidth={2} />
            </span>

            <span className="font-display text-[1.25rem] font-semibold tracking-tight text-ink">
              Tholafind
            </span>
          </Link>

          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              border border-line
              text-inkSoft
              transition-colors
              hover:border-pine
              hover:text-ink
            "
          >
            <X size={19} strokeWidth={2} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">

          {/* Navigation */}
          <div>
            <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-inkSoft">
              Navigation
            </p>

            <nav className="flex flex-col">
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
                    className={`
                      flex items-center
                      border-b border-line/60
                      py-4
                      font-mono
                      text-[0.72rem]
                      uppercase
                      tracking-[0.14em]
                      transition-colors
                      ${
                        active
                          ? 'text-brick'
                          : 'text-inkSoft hover:text-ink'
                      }
                    `}
                  >
                    <span
                      className={`
                        mr-3 h-1.5 w-1.5 rounded-full
                        transition-opacity
                        ${
                          active
                            ? 'bg-brick opacity-100'
                            : 'bg-pine opacity-0'
                        }
                      `}
                    />

                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Account */}
          <div className="mt-8">
            <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-inkSoft">
              Account
            </p>

            <SignedOut>
              <SignInButton
                forceRedirectUrl="/onboarding"
                signUpForceRedirectUrl="/onboarding"
              >
                <button
                  onClick={closeMobileMenu}
                  className="
                    w-full
                    rounded-full
                    border border-line
                    px-4 py-3
                    font-mono
                    text-[0.7rem]
                    uppercase
                    tracking-[0.12em]
                    text-inkSoft
                    transition-all
                    hover:border-pine
                    hover:bg-pine
                    hover:text-paper
                  "
                >
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link
                href="/account"
                onClick={closeMobileMenu}
                className="
                  flex w-full
                  items-center
                  gap-3
                  rounded-md
                  border border-line
                  px-4 py-3
                  font-mono
                  text-[0.7rem]
                  uppercase
                  tracking-[0.12em]
                  text-inkSoft
                  transition-colors
                  hover:border-pine
                  hover:text-ink
                "
              >
                <CreditCard size={15} />
                Account & Billing
              </Link>
            </SignedIn>
          </div>

          {/* Bottom Message */}
          <div className="mt-auto pt-10">
            <div className="rounded-md bg-paperDim p-5">
              <p className="font-display text-lg font-semibold text-ink">
                You saw it once.
              </p>

              <p className="mt-1 font-display text-lg italic text-brick">
                We&rsquo;ll help you find it again.
              </p>

              <p className="mt-3 text-xs leading-relaxed text-inkSoft">
                Snap it, search it, and let Tholafind track it down.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}