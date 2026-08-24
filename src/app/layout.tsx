import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import { DynamicIslandToastProvider } from "@/components/ui/dynamic-island-toast";
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

/**
 * Aplica la clase `dark` antes del primer pintado, para que no se vea el
 * destello de modo claro. Va inline y de forma síncrona a propósito: cualquier
 * alternativa asíncrona pintaría primero y corregiría después.
 */
const themeBootstrap = `(function(){try{var d=document.documentElement,p=localStorage.getItem("theme");if(p!=="light"&&p!=="dark"&&p!=="system")p="system";var r=p==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;d.classList.toggle("dark",r==="dark");d.style.colorScheme=r;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`${plusJakarta.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ThemeRegistry>
            <DynamicIslandToastProvider>
              {children}
            </DynamicIslandToastProvider>
          </ThemeRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
