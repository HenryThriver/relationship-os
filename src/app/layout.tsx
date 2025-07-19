import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/styles/mobile.css";
import AppProviders from "@/components/providers/AppProviders";
import { Footer } from "@/components/ui/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cultivate HQ",
  description: "Where strategic minds cultivate extraordinary outcomes through systematic relationship intelligence.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      {/* 
        The head tag is automatically managed by Next.js.
        You can add global metadata here or in individual page components.
        Refer to: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#head-metadata
      */}
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true} // Added to handle browser extension DOM modifications
      >
        <AppProviders>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* 
              The DashboardLayout could be conditionally rendered here based on route 
              or a higher-order component logic if not all pages use it.
              For now, assuming it's global or handled by route groups.
            */}
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
