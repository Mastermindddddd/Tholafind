'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * A top-of-viewport progress bar that starts the instant someone clicks any
 * internal link, and completes once the destination page's pathname (or
 * search params) actually changes. This covers the gap loading.tsx doesn't:
 * pages with no async data fetch still get a visible "something happened"
 * signal, and slow data-fetching pages get a bar immediately instead of a
 * blank frozen screen until their own loading.tsx mounts.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listen for clicks on any same-tab, internal link and start the bar
  // immediately — before Next.js has even started fetching the next page.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');
      if (!href || href.startsWith('#') || target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let "open in new tab" etc. through untouched

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // external link — no bar
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page

      setVisible(true);
      setProgress(15);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Once the route actually changes, finish the bar and hide it shortly after.
  useEffect(() => {
    if (!visible) return;

    setProgress(100);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(hideTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // While visible and not yet complete, creep the bar forward so a slow
  // navigation doesn't just sit frozen at 15%.
  useEffect(() => {
    if (!visible || progress >= 90) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.random() * 10));
    }, 300);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, progress]);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-[9999] h-[3px] w-full bg-transparent">
      <div
        className="h-full bg-brick transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}