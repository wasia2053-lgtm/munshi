import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Munshi - AI WhatsApp Secretary',
    template: '%s | Munshi'
  },
  description: 'Pakistan ka #1 AI WhatsApp chatbot. Apne business ko automate karo — Roman Urdu mein. Free se shuru karo.',
  keywords: ['WhatsApp bot', 'AI chatbot Pakistan', 'WhatsApp automation', 'Roman Urdu bot', 'Munshi'],
  authors: [{ name: 'Munshi' }],
  creator: 'Munshi',
  metadataBase: new URL('https://munshi.pk'),
  openGraph: {
    title: 'Munshi - AI WhatsApp Secretary',
    description: 'Pakistan ka #1 AI WhatsApp chatbot. Free se shuru karo.',
    url: 'https://munshi.pk',
    siteName: 'Munshi',
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Munshi - AI WhatsApp Secretary',
    description: 'Pakistan ka #1 AI WhatsApp chatbot.',
  },
icons: {
  icon: '/favicon.svg',
},
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&display=swap" rel="stylesheet" />
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
    rel="stylesheet"
  />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
