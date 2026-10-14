import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: "../public/fonts/manrope-latin-variable.woff2",
  variable: "--font-sans",
  display: "swap",
});
const serif = localFont({
  src: "../public/fonts/instrument-serif-latin-italic.woff2",
  variable: "--font-serif",
  display: "swap",
});
const editorial = localFont({
  src: "../public/fonts/instrument-serif-latin-normal.woff2",
  variable: "--font-editorial",
  display: "swap",
});
const title = "TripHalo | Technology & Experience Studio";
const description =
  "Independent technology and experience studio. Bespoke software, AI and automation, alongside consultancy and human-led travel experiences.";
export const metadata: Metadata = {
  metadataBase: new URL("https://www.triphalo.com"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "TripHalo",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/resonance-og.jpg",
        width: 1200,
        height: 630,
        alt: "TripHalo — Intelligence in service of human experience. Neurons of light converge into a halo and open onto a shared human landscape.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/resonance-og.jpg"],
  },
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  themeColor: "#f1f0e9",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${sans.variable} ${serif.variable} ${editorial.variable}`}>
      <body>{children}</body>
    </html>
  );
}
