import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationProvider } from "@/components/NotificationSystem";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WhaleTools - Professional Cannabis Testing & COA Generation",
  description: "Professional cannabis testing and analysis tools for Certificate of Analysis generation. Create compliant COAs with validated methodologies and quality control protocols.",
  keywords: ["cannabis testing", "COA generation", "certificate of analysis", "hemp testing", "cannabinoid analysis", "laboratory testing", "compliance"],
  authors: [{ name: "WhaleTools" }],
  creator: "WhaleTools",
  publisher: "WhaleTools",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://whaletools.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "WhaleTools - Professional Cannabis Testing & COA Generation",
    description: "Professional cannabis testing and analysis tools for Certificate of Analysis generation. Create compliant COAs with validated methodologies and quality control protocols.",
    url: 'https://whaletools.vercel.app',
    siteName: 'WhaleTools',
    images: [
      {
        url: '/logowhaletools.png',
        width: 1200,
        height: 630,
        alt: 'WhaleTools - Professional Cannabis Testing Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "WhaleTools - Professional Cannabis Testing & COA Generation",
    description: "Professional cannabis testing and analysis tools for Certificate of Analysis generation.",
    images: ['/logowhaletools.png'],
    creator: '@whaletools',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#0ea5e9' },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#0ea5e9',
    'theme-color': '#ffffff',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <NotificationProvider>
            {/* Navigation Header */}
            <nav className="bg-neutral-800/50 backdrop-blur-sm shadow-lg border-b border-neutral-700/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center space-x-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                      <span className="text-2xl font-bold text-neutral-100" style={{ fontFamily: 'Lobster, cursive' }}>
                        WhaleTools
                      </span>
                    </Link>
                    
                    {/* Navigation Links */}
                    <div className="hidden md:flex space-x-4">
                      <Link 
                        href="/" 
                        className="smooth-hover text-neutral-300 hover:text-neutral-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Generator
                      </Link>
                      <Link 
                        href="/live-coas" 
                        className="smooth-hover text-neutral-300 hover:text-neutral-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Live COAs
                      </Link>
                    </div>
                  </div>
                  
                  {/* Mobile menu button */}
                  <div className="md:hidden flex items-center">
                    <button className="smooth-hover text-neutral-300 hover:text-neutral-100 p-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </nav>
            
            {children}
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
