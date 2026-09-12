import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ChatBot } from "@/components/chat/ChatBot";
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
    default: "KlagonOrg — Preparing Klagon's Youth for the Future",
    template: "%s | KlagonOrg",
  },
  description:
    "KlagonOrg empowers Klagon's youth with skills, mentorship, and community. Join free today.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://klagon.org",
    siteName: "KlagonOrg",
    title: "KlagonOrg — Preparing Klagon's Youth for the Future",
    description:
      "KlagonOrg empowers Klagon's youth with skills, mentorship, and community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KlagonOrg — Preparing Klagon's Youth for the Future",
    description:
      "KlagonOrg empowers Klagon's youth with skills, mentorship, and community.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <ChatBot />
      </body>
    </html>
  );
}
