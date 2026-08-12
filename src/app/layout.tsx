import type { Metadata } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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

export const metadata: Metadata = {
  title: "Orange Banana",
  description: "Tài chính, nhật ký và việc học của bạn — một nơi duy nhất.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={cn("h-full", "antialiased", obDisplay.variable, obText.variable, obNum.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
