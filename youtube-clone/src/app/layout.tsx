import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AdminProvider } from "@/context/AdminContext";
import NavBar from "@/components/NavBar";
import ThumbnailMaker from "@/components/ThumbnailMaker";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StreamSummarize - Video Summaries",
  description: "Watch text summaries of videos instead of full videos. Save time and learn faster.",
  keywords: ["video summaries", "youtube summaries", "learning", "productivity"],
  openGraph: {
    title: "StreamSummarize - Video Summaries",
    description: "Watch text summaries of videos instead of full videos. Save time and learn faster.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen`}>
        <ThemeProvider>
          <AdminProvider>
            <div className="flex flex-col min-h-screen">
              <NavBar />
              <main className="flex-1">
                {children}
              </main>
              <footer className="py-6 px-4 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>StreamSummarize — Video summaries, not video distractions</p>
                <p className="mt-1 text-xs">
                  All content links to original YouTube videos. This app does not host any video content.
                </p>
              </footer>
            </div>
            <ThumbnailMaker />
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
