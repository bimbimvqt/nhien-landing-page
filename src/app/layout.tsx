import type { Metadata } from "next";
import "./globals.css";

export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Nhiên CàFe - Chạm vào sự thư giãn",
  description: "Cà phê mang đi - Trải nghiệm sự giản dị và nhẹ nhàng tại Nhiên CàFe.",
  keywords: ["Nhiên CàFe", "cà phê mang đi", "cà phê nguyên chất", "quán cà phê đẹp", "coffee shop"],
  authors: [{ name: "Nhiên CàFe" }],
  openGraph: {
    title: "Nhiên CàFe - Chạm vào sự thư giãn",
    description: "Cà phê mang đi - Trải nghiệm sự giản dị và nhẹ nhàng tại Nhiên CàFe.",
    url: "https://nhiencafe.com", // Replace with real URL
    siteName: "Nhiên CàFe",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nhiên CàFe - Chạm vào sự thư giãn",
    description: "Cà phê mang đi - Trải nghiệm sự giản dị và nhẹ nhàng tại Nhiên CàFe.",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { RedeemSuccessPopup } from "@/components/landing/RedeemSuccessPopup";
import { Toaster } from "sonner";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >

          {children}
          <RedeemSuccessPopup />
          <Toaster
            theme="dark"
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: { fontFamily: 'inherit' },
            }}
          />

        </ThemeProvider>
      </body>
    </html>
  );
}
