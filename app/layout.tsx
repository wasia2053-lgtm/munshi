import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { Syne } from 'next/font/google'
const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-syne' })

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
    default: 'Munshi - WhatsApp Business Operating System',
    template: '%s | Munshi'
  },
  description: 'Automate your WhatsApp business communication with AI. Multi-language support including Roman Urdu and Arabic. Start free.',
  keywords: ['WhatsApp bot', 'AI chatbot', 'WhatsApp automation', 'WhatsApp Business API', 'Munshi'],
  authors: [{ name: 'Munshi' }],
  creator: 'Munshi',
  metadataBase: new URL('https://munshi.pk'),
  openGraph: {
    title: 'Munshi - WhatsApp Business Operating System',
    description: 'Automate your WhatsApp business communication with AI. Start free.',
    url: 'https://munshi.pk',
    siteName: 'Munshi',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Munshi - WhatsApp Business Operating System',
    description: 'Automate your WhatsApp business communication with AI.',
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
    <html lang="en" className="dark">
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
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}