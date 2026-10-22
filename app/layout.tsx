import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource/lilita-one/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foco e Rotina",
  description: "Lembretes de remédio e rotina, simples e sem culpa.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Foco e Rotina", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3d7f77" },
    { media: "(prefers-color-scheme: dark)", color: "#15212b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
