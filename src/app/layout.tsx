import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SynchroManage",
  description: "Gestión de proyectos informáticos",
  icons: {
    icon: "/logo/sm-icon-blanco.png",
    apple: "/logo/sm-icon-blanco.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
