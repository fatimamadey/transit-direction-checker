import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Take This One",
  description: "A transit app that helps you avoid boarding the wrong train."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
