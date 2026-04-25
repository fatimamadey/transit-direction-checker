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
          colorText: "#ffffff",
          colorTextSecondary: "#d4c9f7",
          colorInputBackground: "#120f23",
          colorInputText: "#ffffff",
          colorNeutral: "#3b335f",
          colorDanger: "#ff6a88",
          borderRadius: "14px"
        },
        elements: {
          card: "border border-white/12 bg-[#110d20] shadow-[0_32px_90px_rgba(7,6,15,0.65)]",
          headerTitle: "font-[var(--font-display)] text-white",
          headerSubtitle: "text-violet-100/90",
          socialButtonsBlockButtonText: "text-white",
          socialButtonsBlockButton:
            "border border-white/14 bg-[#19142f] text-white transition hover:border-fuchsia-400/70 hover:bg-fuchsia-500/10",
          formButtonPrimary:
            "bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] hover:opacity-95",
          formFieldInput:
            "border border-white/14 bg-[#120f23] text-white placeholder:text-violet-100/55 focus:border-cyan-300/70 focus:ring-cyan-300/20",
          formFieldLabel: "text-violet-100",
          formFieldHintText: "text-violet-100/80",
          formFieldWarningText: "text-amber-200",
          formFieldErrorText: "text-rose-300",
          dividerLine: "bg-white/12",
          dividerText: "text-violet-100/85",
          footer: "bg-transparent",
          footerActionText: "text-violet-100/85",
          footerActionLink: "text-cyan-300 hover:text-cyan-200",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-cyan-300 hover:text-cyan-200",
          formResendCodeLink: "text-cyan-300 hover:text-cyan-200"
        }
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
