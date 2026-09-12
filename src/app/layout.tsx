import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ChatBot } from "@/components/chat/ChatBot";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stars.klagon.org"),
  title: "KlagonStudios — Preparing Klagon's Youth for the Future",
  description:
    "KlagonStudios empowers Klagon's youth with skills, mentorship, and community. Join free today.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "KlagonStudios — Preparing Klagon's Youth for the Future",
    description:
      "KlagonStudios empowers Klagon's youth with skills, mentorship, and community.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        {children}
        <ChatBot />
      </body>
    </html>
  );
}
