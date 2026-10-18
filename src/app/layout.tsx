import type { Metadata, Viewport } from "next";
import { Battambang, Noto_Sans_Khmer } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import { site } from "@/lib/site";
import "./globals.css";

const battambang = Battambang({
  subsets: ["khmer", "latin"],
  weight: ["400", "700"],
  variable: "--font-battambang",
  display: "swap",
});

const notoKhmer = Noto_Sans_Khmer({
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-khmer",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#EEF5F1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="km" className={`${battambang.variable} ${notoKhmer.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
