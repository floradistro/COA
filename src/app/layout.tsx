import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationProvider } from "@/components/NotificationSystem";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhaleTools",
  description: "Professional cannabis testing and analysis tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <NotificationProvider>
            {/* Navigation Header */}
            <nav className="bg-white shadow-lg border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center space-x-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'Lobster, cursive' }}>
                        WhaleTools
                      </span>
                    </Link>
                    
                    {/* Navigation Links */}
                    <div className="hidden md:flex space-x-4">
                      <Link 
                        href="/" 
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Generator
                      </Link>
                      <Link 
                        href="/live-coas" 
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Live COAs
                      </Link>
                    </div>
                  </div>
                  
                  {/* Mobile menu button */}
                  <div className="md:hidden flex items-center">
                    <button className="text-gray-700 hover:text-blue-600 p-2">
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
