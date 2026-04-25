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
          colorBackground: "#1b1632",
          colorPrimary: "#ff4fd8",
          colorText: "#ffffff",
          colorTextSecondary: "#f3ebff",
          colorInputBackground: "#241d43",
          colorInputText: "#ffffff",
          colorNeutral: "#5a4f87",
          colorDanger: "#ff6a88",
          borderRadius: "14px"
        },
        elements: {
          rootBox: "w-full",
          cardBox: "w-full max-w-[460px]",
          card: "border border-white/16 bg-[#20193d] shadow-[0_32px_90px_rgba(7,6,15,0.72)]",
          headerTitle: "font-[var(--font-mono)] text-white !text-white",
          headerSubtitle: "text-white/92",
          socialButtonsBlockButtonText: "!text-white",
          socialButtonsBlockButton:
            "border border-white/18 bg-[#2a214b] text-white transition hover:border-fuchsia-400/70 hover:bg-fuchsia-500/10",
          formButtonPrimary:
            "bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] hover:opacity-95",
          formFieldInput:
            "border border-white/16 bg-[#241d43] text-white placeholder:text-white/65 focus:border-cyan-300/70 focus:ring-cyan-300/20",
          formFieldLabel: "!text-white",
          formFieldLabelRow: "!text-white",
          formFieldHintText: "text-white/85",
          formFieldWarningText: "text-amber-200",
          formFieldErrorText: "text-rose-300",
          dividerLine: "bg-white/12",
          dividerText: "text-white/85",
          footer: "bg-transparent",
          footerActionText: "text-white/88",
          footerActionLink: "text-cyan-300 hover:text-cyan-200",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-cyan-300 hover:text-cyan-200",
          formResendCodeLink: "text-cyan-300 hover:text-cyan-200",
          otpCodeFieldInput: "bg-[#241d43] text-white border border-white/16",
          formHeaderTitle: "!text-white",
          formHeaderSubtitle: "text-white/92"
        }
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
