import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import { appName, siteUrl } from '@/lib/shared';
import type { Metadata } from 'next';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

const description =
  'Gears is a mod settings framework for 7 Days to Die. Give your mod a settings page in the game’s Mods menu, readable from both XML patches and C#.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s | ${appName}`,
    default: `${appName} — mod settings for 7 Days to Die`,
  },
  description,
  // Inherited by every page. A docs page overrides `images` with its own card; without this the
  // landing page shared as a bare link with no image at all.
  openGraph: {
    type: 'website',
    siteName: appName,
    url: siteUrl,
    title: `${appName} — mod settings for 7 Days to Die`,
    description,
    images: {
      url: '/og/site/image.png',
      width: 1200,
      height: 630,
      alt: `${appName}: give your mod a settings page`,
    },
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
