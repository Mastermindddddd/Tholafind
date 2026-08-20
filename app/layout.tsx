import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tholafind — Log it. We\u2019ll track it down.',
  description:
    'Snap a photo of anything you can\u2019t find, and Tholafind searches retail, marketplaces, and resale at once \u2014 with a crowd of finders standing by when the trail goes cold.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;0,700;0,900;1,500;1,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
