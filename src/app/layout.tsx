import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SalesAgent } from "@/components/chat/SalesAgent";
import { Observability } from "@/components/observability/Observability";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://klagon.org"),
  title: {
    default: "KLAGON.org — The Digital Home of Klagon",
    template: "%s | KLAGON.org",
  },
  description:
    "KLAGON.org is the digital home of Klagon — where the community learns, hosts, maps itself, and does business. Join free today.",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/brand/klagon-logo.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/brand/klagon-logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://klagon.org",
    siteName: "KLAGON.org",
    title: "KLAGON.org — The Digital Home of Klagon",
    description:
      "The digital home of Klagon — discover what's happening, find local businesses, learn new skills, and help build the community.",
    images: [{ url: "/brand/og-banner.png", width: 1200, height: 630, alt: "KLAGON.org" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KLAGON.org — The Digital Home of Klagon",
    description:
      "The digital home of Klagon — discover what's happening, find local businesses, learn new skills, and help build the community.",
    images: ["/brand/og-banner.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <SalesAgent />
            <Observability />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
