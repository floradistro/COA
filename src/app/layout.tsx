import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationProvider } from "@/components/NotificationSystem";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "WhaleTools - Tools for Whales",
  description: "Tools for Whales - Advanced tools and resources for professionals who need powerful solutions.",
  keywords: ["whaletools", "tools for whales", "professional tools", "productivity", "business tools"],
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
    title: "WhaleTools - Tools for Whales",
    description: "Tools for Whales - Advanced tools and resources for professionals who need powerful solutions.",
    url: 'https://whaletools.vercel.app',
    siteName: 'WhaleTools',
    images: [
      {
        url: '/logowhaletools.png',
        width: 1200,
        height: 630,
        alt: 'WhaleTools - Tools for Whales',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "WhaleTools - Tools for Whales",
    description: "Tools for Whales - Advanced tools and resources for professionals who need powerful solutions.",
    images: ['/logowhaletools.png'],
  },
  icons: {
    icon: '/logowhaletools.png',
    apple: '/logowhaletools.png',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-black">
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
