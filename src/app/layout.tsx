import type { Metadata } from "next";
import "@fontsource/geist";        
import "@fontsource/geist-mono";
import "./globals.css";
export const metadata: Metadata = {
  title: "GuitarFi on BASE",
  description: "",
  openGraph: {
    title: "GuitarFi on BASE",
    description:
      "Building a daily habit on BASE",
    images: ["/og-banner.png"],
  },
  other: {
  
    "talentapp:project_verification":
  "0f75184a3c862d001e9097304aad806a4bc100dadd5870723181d3baf887470637c387d44727536c32ba618c1f2556868f6369c48c19f69a5d1f73df6d5145b2",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;  
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Geist, sans-serif",
          background: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
