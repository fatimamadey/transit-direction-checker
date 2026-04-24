import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulseboard",
  description: "A GitHub activity dashboard for shared boards and polling-based live feeds."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorBackground: "#130f23",
          colorPrimary: "#ff4fd8",
          colorText: "#f3eefe",
          colorTextSecondary: "#9f95c9",
          colorInputBackground: "#1b1632",
          colorInputText: "#f3eefe",
          colorNeutral: "#2c2550",
          colorDanger: "#ff6a88",
          borderRadius: "14px"
        },
        elements: {
          card: "border border-white/10 bg-[#130f23]/95 shadow-[0_32px_90px_rgba(7,6,15,0.55)]",
          headerTitle: "font-[var(--font-display)] text-white",
          headerSubtitle: "text-violet-200/70",
          socialButtonsBlockButton:
            "border border-white/12 bg-white/5 text-white transition hover:border-fuchsia-400/70 hover:bg-fuchsia-500/10",
          formButtonPrimary:
            "bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] hover:opacity-95",
          formFieldInput:
            "border border-white/10 bg-[#1b1632] text-white placeholder:text-violet-200/40 focus:border-cyan-300/70 focus:ring-cyan-300/20",
          footerActionLink: "text-cyan-300 hover:text-cyan-200",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-cyan-300 hover:text-cyan-200"
        }
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
