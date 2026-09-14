import type { Metadata } from 'next';
import Script from 'next/script';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

  export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tholafind.com'),
    title: 'Tholafind - Log it. We\u2019ll track it down.',
    description: 'Snap a photo of anything you can\u2019t find, and Tholafind searches retail, marketplaces, and resale at once \u2014 with a crowd of finders standing by when the trail goes cold.',
  };


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#1F3B33',
          colorText: '#182420',
          colorBackground: '#FBFAF4',
          borderRadius: '6px',
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;0,700;0,900;1,500;1,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
        </head>

        <body className="font-body antialiased">
          {children}

          {/* Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-XSMG4Q527G"
            strategy="afterInteractive"
          />

          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-XSMG4Q527G');
            `}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  );
}