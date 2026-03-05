import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "NomadSteals - Daily Travel Deals with Value Scores | Flights, Hotels & Packages",
    template: "%s | NomadSteals"
  },
  description: "Discover the best travel deals daily. Flights, hotels, and vacation packages with Value Scores to help you find the best bang for your buck. Average savings of 42% across all deals.",
  keywords: [
    "travel deals",
    "cheap flights",
    "hotel deals",
    "vacation packages",
    "flight deals",
    "error fares",
    "mistake fares",
    "last minute deals",
    "travel discounts",
    "budget travel"
  ],
  authors: [{ name: "NomadSteals" }],
  creator: "NomadSteals",
  publisher: "NomadSteals",
  metadataBase: new URL("https://nomadsteals.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nomadsteals.com",
    siteName: "NomadSteals",
    title: "NomadSteals - Daily Travel Deals with Value Scores",
    description: "Find the best flights, hotels, and packages with our unique Value Score system. Updated daily.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NomadSteals - Travel Deals"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "NomadSteals - Daily Travel Deals",
    description: "Discover amazing travel deals with Value Scores. Flights, hotels & packages.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
