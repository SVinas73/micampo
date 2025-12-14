import type { Metadata } from "next";
import { Poppins } from 'next/font/google'
import "./globals.css";
import { Providers } from "./providers";

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: "MiCampo - Gestión Agropecuaria",
  description: "Plataforma integral para la gestión de tu campo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={poppins.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}