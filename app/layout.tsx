import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dancing-script",
  display: "swap",
});

const appDomain = "https://timmies.vercel.app";
const heroImageUrl = `${appDomain}/media/hero.png`;
const splashImageUrl = `${appDomain}/media/splash.png`;

const miniAppEmbed = {
  version: "1",
  imageUrl: heroImageUrl,
  button: {
    title: "Tims Donut Shop",
    action: {
      type: "launch_miniapp" as const,
      name: "Tims",
      url: appDomain,
      splashImageUrl,
      splashBackgroundColor: "#FFFFFF",
    },
  },
};

export const metadata: Metadata = {
  title: "Timmies Donut Shop",
  description: "Double-double and a dozen donuts, eh! Grab a coffee, claim the shop, and earn donuts on Base. Always fresh, bud.",
  openGraph: {
    title: "Tims Donut Shop",
    description: "Double-double and a dozen donuts, eh! Join the crew and keep the donuts rollin'. Always fresh, bud.",
    url: appDomain,
    images: [
      {
        url: heroImageUrl,
      },
    ],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dancingScript.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
