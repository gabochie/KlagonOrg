import type { Metadata } from "next";
import { ChatBot } from "@/components/chat/ChatBot";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://stars.klagon.org"),
  title: "Klagon Studios — Preparing Klagon's Youth for the Future",
  description:
    "Klagon Studios empowers Klagon's youth with skills, mentorship, and community. Join free today.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Klagon Studios — Preparing Klagon's Youth for the Future",
    description:
      "Klagon Studios empowers Klagon's youth with skills, mentorship, and community.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ChatBot />
      </body>
    </html>
  );
}
