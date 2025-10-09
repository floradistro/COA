import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationProvider } from "@/components/NotificationSystem";
import { AuthProvider } from "@/contexts/AuthContext";
import Link from "next/link";
import Navigation from "@/components/Navigation";

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
          <AuthProvider>
            <NotificationProvider>
              <Navigation />
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
