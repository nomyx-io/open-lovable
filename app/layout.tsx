import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

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

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Open Lovable v3",
  description: "Re-imagine any website in seconds with AI-powered website builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (theme === 'system' && systemDark) || (!theme && systemDark);
                  document.documentElement.classList.add(isDark ? 'dark' : 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} font-sans antialiased bg-background text-foreground transition-colors duration-300`}>
        <SessionProvider>
          <ThemeProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
