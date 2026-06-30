import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "MiCampo - Gestión Agropecuaria",
  description: "El sistema nervioso central del agro moderno",
  appleWebApp: { capable: true, title: "MiCampo", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: "#324428",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      data-theme="light"
      data-palette="natural"
      data-font="inter"
      data-density="compact"
    >
      <head>
        {/* Fuentes cargadas vía <link> (runtime, sin dependencia de red en build) — fiel al prototipo Figma */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=Fraunces:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
