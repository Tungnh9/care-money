import type { Metadata } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";
import { LocaleProvider } from "@/components/locale-provider";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/get-server-locale";

const obDisplay = Bricolage_Grotesque({
  variable: "--font-ob-display",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
});

const obText = Be_Vietnam_Pro({
  variable: "--font-ob-text",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const obNum = JetBrains_Mono({
  variable: "--font-ob-num",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getServerLocale());
  return {
    title: dict.common.appName,
    description: dict.common.appDescription,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={cn("h-full", "antialiased", obDisplay.variable, obText.variable, obNum.variable)}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale}>
          <AuthGuard>{children}</AuthGuard>
        </LocaleProvider>
      </body>
    </html>
  );
}
