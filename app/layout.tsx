import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { BridgeProvider } from "@/components/bridge-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import TabNavigation from "@/components/tab-navigation";

const geist = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const appName = "Т-Счётчик";

export const metadata: Metadata = {
  title: appName,
  description: appName,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <BridgeProvider />
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-xl overflow-hidden">
            <div className="mx-auto max-w-5xl px-4 max-sm:px-3 max-[400px]:px-2 max-[250px]:px-1 h-16 max-[400px]:h-14 max-[250px]:h-12 grid grid-cols-[auto_1fr_auto] items-center gap-2 max-[400px]:gap-1 max-[250px]:gap-0.5">
              <Link
                href="/"
                className="flex items-center gap-3 max-[400px]:gap-2 shrink-0 group"
              >
                <div className="flex h-9 w-9 max-[400px]:h-8 max-[400px]:w-8 items-center justify-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary/25 transition-colors">
                  <BarChart3 className="h-5 w-5 max-[400px]:h-4 max-[400px]:w-4" />
                </div>
                <span className="text-lg font-bold tracking-tight text-foreground max-sm:hidden">
                  {appName}
                </span>
              </Link>
              <div className="flex justify-center">
                <TabNavigation />
              </div>
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/40">
            <div className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-muted-foreground/60">
              © 2026 @sozynov
            </div>
          </footer>
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              classNames: {
                toast: "cn-toast",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
