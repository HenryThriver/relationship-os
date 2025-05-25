import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import { AuthProvider } from '@/lib/contexts/AuthContext'; // No longer directly used here
// import ThemeRegistry from '@/components/theme/ThemeRegistry'; // No longer directly used here
import AppProviders from '@/components/providers/AppProviders'; // Added
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Theme creation is now in ThemeRegistry.tsx

export const metadata: Metadata = {
  title: "Relationship OS",
  description: "Transform networking from overwhelming to systematic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders> {/* Changed to AppProviders */}
          {children}
        </AppProviders> {/* Changed to AppProviders */}
      </body>
    </html>
  );
}
