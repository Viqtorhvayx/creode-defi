import type { Metadata } from "next";
import "./globals.css";
import { AppKitProvider } from "@/context/AppKitProvider";
import { WalletProvider } from "@/context/WalletContext";

/**
 * @title RootLayout (Advanced Wallet Architecture)
 * @author Viqtorhvayx
 * @dev Root layout for CREODE DeFi. Integrated with AppKit and the Advanced Identity Engine.
 */

export const metadata: Metadata = {
  title: "CREODE DEFI | Hedera Testnet",
  description: "Advanced Saving, Lending, and Borrowing platform on Hedera. Engineered by Viqtorhvayx.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background transition-colors duration-500">
        <AppKitProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </AppKitProvider>
      </body>
    </html>
  );
}
