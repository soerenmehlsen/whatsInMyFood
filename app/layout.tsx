import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
// import { ClerkProvider } from '@clerk/nextjs'
import { GoogleAnalytics } from '@next/third-parties/google'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { PostHogProvider } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "What's in my food?",
  description: "Empower your dietary choices with WhatsInMyFood. Simply snap a photo of any food's ingredient list, and our AI-driven platform provides a comprehensive analysis of each ingredient, highlighting its level of processing. Make informed decisions and understand what's in your food today.",
  keywords: [
    "Food Ingredient Analysis",
    "Food Processing",
    "Food Ingredients",
    "Food AI",
    "Food Analysis",
    "Food Processing Level",
    "Food Processing Analysis",
    "Food Processing AI",
    "Food Processing Level AI",
    "Nutritional Information",
    "Food Nutrition",
    "Food Nutrition Analysis",
    "Food Nutrition Level",
  ],
   appleWebApp: {
    title: "What's in my food",   
    capable: true,                
    statusBarStyle: "default",    
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <PostHogProvider>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <Header />
            <main>{children}</main>
          <GoogleAnalytics gaId="G-CXSN8X36QC" />
          <SpeedInsights />
          <Footer />
      </body>
    </PostHogProvider>
    </html>
  );
}
