import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://atlas-flame-chi.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Atlas — The Wealth Exploration Layer',
    template: '%s · Atlas',
  },
  description: 'A 3D navigable world of DeFi opportunities on Mantle. Explore where your capital can go — no wallet required.',
  keywords: ['DeFi', 'Mantle', 'Web3', 'yield', 'portfolio', 'wealth', 'atlas', 'explore'],
  authors: [{ name: 'Atlas' }],
  creator: 'Atlas',

  openGraph: {
    type: 'website',
    url: APP_URL,
    title: 'Atlas — The Wealth Exploration Layer',
    description: 'A 3D navigable world of DeFi opportunities on Mantle. Explore, discover, and allocate — wonder first, wallet third.',
    siteName: 'Atlas',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Atlas — The Wealth Exploration Layer for Web3',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Atlas — The Wealth Exploration Layer',
    description: 'A 3D navigable world of DeFi opportunities on Mantle. Wonder first, wallet third.',
    images: ['/api/og'],
    creator: '@atlasfinance',
  },

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },

  manifest: '/manifest.json',

  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#030712' },
    { media: '(prefers-color-scheme: light)', color: '#030712' },
  ],

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="h-full bg-[#030712] text-white overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
